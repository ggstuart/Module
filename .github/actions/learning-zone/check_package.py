#!/usr/bin/env python3
"""Check a Learning Zone package folder before it is zipped.

Fails if imsmanifest.xml is not well-formed or names a file that is missing.
Prints GitHub warnings for files the manifest does not list, references that
still start at the site root, broken relative links, and iframes or links on
other pages that lead to the package's home page (usually a path the theme
could not resolve, so it fell back to the site's root), and lists the
external websites the pages load or link to.

Usage: check_package.py PACKAGE_DIR
"""
import sys, os, re, xml.etree.ElementTree as ET
from urllib.parse import urlsplit, unquote
root = sys.argv[1]
gh = bool(os.environ.get("GITHUB_ACTIONS"))
def warn(msg):
    print(("::warning::" if gh else "warning: ") + msg)

ns = {"m": "http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"}
tree = ET.parse(os.path.join(root, "imsmanifest.xml"))  # raises if not well-formed
m = tree.getroot()
assert m.tag == "{%s}manifest" % ns["m"], m.tag
assert m.find("m:metadata/m:schema", ns).text == "IMS Common Cartridge"
assert m.find("m:metadata/m:schemaversion", ns).text == "1.1.0"
assert os.path.exists(os.path.join(root, "imscc.xml"))
res = {r.get("identifier"): r for r in m.iterfind("m:resources/m:resource", ns)}
ids = [r.get("identifier") for r in m.iterfind("m:resources/m:resource", ns)]
assert len(ids) == len(set(ids)), "duplicate resource ids"
items = list(m.iter("{%s}item" % ns["m"]))
iids = [i.get("identifier") for i in items]
assert len(iids) == len(set(iids)), "duplicate item ids"
missing = []
for i in items:
    ref = i.get("identifierref")
    if ref and ref not in res: missing.append("item->" + ref)
listed = set()
for r in res.values():
    for h in [r.get("href")] + [f.get("href") for f in r.iterfind("m:file", ns)]:
        if h is None: continue
        listed.add(h)
        if not os.path.isfile(os.path.join(root, unquote(h))): missing.append(h)
allfiles = set()
for d, _, fs in os.walk(root):
    for f in fs:
        allfiles.add(os.path.relpath(os.path.join(d, f), root))
unlisted = sorted(allfiles - listed - {"imsmanifest.xml", "imscc.xml"})
topics = sum(1 for i in items if i.get("identifierref"))
print(f"items: {len(items)} ({topics} topics), resources: {len(res)}, files in package: {len(allfiles)}")
if missing:
    print(("::error::" if gh else "error: ") + f"{len(missing)} manifest entries point at missing files: {missing[:20]}")
    sys.exit(1)
if unlisted:
    warn(f"{len(unlisted)} files are in the package but not in imsmanifest.xml: {unlisted[:20]}")
# references inside html/css
attr = re.compile(r'''(?:href|src|poster|data|action)\s*=\s*["']([^"']*)["']|url\(\s*["']?([^"')]+)["']?\s*\)|@import\s+["']([^"']+)["']''', re.I)
rootabs, external, broken, to_home = [], {}, [], []
for f in sorted(allfiles):
    if not f.endswith((".html", ".css", ".js")) or f.startswith("learningzone/js/mermaid"): continue
    text = open(os.path.join(root, f), encoding="utf-8", errors="replace").read()
    if f.endswith(".js"):
        for u in re.findall(r'''https?://[^\s"'`)]+''', text): external.setdefault(u.split("?")[0][:80], set()).add(f)
        continue
    for mm in attr.finditer(text):
        u = next(g for g in mm.groups() if g is not None).strip()
        if not u or u.startswith(("#", "data:", "mailto:", "javascript:", "tel:", "about:")) or "{{" in u: continue
        if re.match(r"//[^/.:?#]+(/|$)", u) and not u.startswith("//localhost"):
            # "//unit/page/": a site-root link mangled by a template
            rootabs.append((f, u))
            continue
        if u.startswith("//"): u = "https:" + u
        if re.match(r"https?://", u, re.I):
            host = urlsplit(u).netloc
            external.setdefault(host, set()).add(f)
            continue
        if u.startswith("/"):
            rootabs.append((f, u)); continue
        p = urlsplit(u).path
        if not p: continue
        target = os.path.normpath(os.path.join(os.path.dirname(f), unquote(p)))
        if os.path.isdir(os.path.join(root, target)):
            target = os.path.normpath(os.path.join(target, "index.html"))
        if not os.path.exists(os.path.join(root, target)):
            broken.append((f, u))
        elif target == "index.html" and f != "index.html" and f.endswith(".html"):
            # An iframe or link that lands on the home page from another page is
            # nearly always a path the theme couldn't resolve and replaced with
            # the site root (an iframe src next to the page, a "../" link...).
            tag = re.match(r"<\s*([a-z0-9]+)", text[text.rfind("<", 0, mm.start()):], re.I)
            tag = tag.group(1).lower() if tag else "?"
            if tag in ("iframe", "a", "img", "embed", "object", "source", "video", "audio"):
                to_home.append((f, tag, u))
if rootabs:
    warn(f"{len(rootabs)} references start at the site root and will not work in Learning Zone: {rootabs[:10]}")
if broken:
    warn(f"{len(broken)} relative links or files could not be found in the package (first ones: {broken[:10]})")
if to_home:
    frames = [x for x in to_home if x[1] != "a"]
    warn(f"{len(to_home)} references on other pages lead to the home page ({len(frames)} of them iframes or media), "
         f"which usually means a path that couldn't be resolved: {to_home[:10]}")
print("websites referenced from the pages (these need internet access in Learning Zone):")
for h, fs in sorted(external.items(), key=lambda x: (-len(x[1]), x[0])):
    print(f"   {h}: {len(fs)} file(s)")
print("package OK")
