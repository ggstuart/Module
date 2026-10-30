#!/usr/bin/env python3
"""Make a Learning Zone package smaller by removing files no topic uses.

Hugo's package build includes every static file and asset the site has, so
that the package always works. This script starts from the pages that are
topics in imsmanifest.xml, follows every reference from there (links,
images, scripts, stylesheets, iframes, CSS url() and @import, linked pages
and their references, and so on), and deletes everything that is not
reached. The manifest is updated to match.

Usage: prune_package.py PACKAGE_DIR
"""
import os
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urlsplit

NS = "http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1"
ET.register_namespace("", NS)
KEEP = {"imsmanifest.xml", "imscc.xml"}
REF = re.compile(
    r"""(?:\b(?:href|src|poster|data|action)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))"""
    r"""|(?:\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)'))"""
    r"""|(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\))"""
    r"""|(?:@import\s+(?:"([^"]*)"|'([^']*)'))""",
    re.I,
)


def refs(text):
    for m in REF.finditer(text):
        groups = m.groups()
        srcset = groups[3] or groups[4]
        if srcset:
            for part in srcset.split(","):
                part = part.strip().split(" ")[0]
                if part:
                    yield part
            continue
        value = next((g for g in groups if g is not None), "")
        if value:
            yield value


def resolve(root, current, ref):
    """Package path a reference points at, or None if it is outside the package."""
    ref = ref.strip()
    if not ref or ref.startswith(("#", "data:", "mailto:", "javascript:", "tel:", "about:", "blob:")):
        return None
    if re.match(r"^[a-z][a-z0-9+.-]*:|^//", ref, re.I) or "{{" in ref:
        return None
    path = unquote(urlsplit(ref).path)
    if not path:
        return None
    if path.startswith("/"):
        target = path.lstrip("/")
    else:
        target = os.path.normpath(os.path.join(os.path.dirname(current), path))
    if target.startswith(".."):
        return None
    if path.endswith("/") or os.path.isdir(os.path.join(root, target)):
        target = os.path.join(target, "index.html")
    target = os.path.normpath(target)
    return target if os.path.isfile(os.path.join(root, target)) else None


def main(root):
    manifest_path = os.path.join(root, "imsmanifest.xml")
    tree = ET.parse(manifest_path)
    manifest = tree.getroot()
    resources = manifest.find(f"{{{NS}}}resources")
    by_id = {r.get("identifier"): r for r in resources}

    # Start from the topics.
    todo = []
    for item in manifest.iter(f"{{{NS}}}item"):
        ref = item.get("identifierref")
        if ref and ref in by_id:
            todo.append(os.path.normpath(by_id[ref].get("href")))

    reached = set()
    while todo:
        f = todo.pop()
        if f in reached:
            continue
        reached.add(f)
        if not f.endswith((".html", ".htm", ".css", ".svg")):
            continue
        with open(os.path.join(root, f), encoding="utf-8", errors="replace") as fh:
            text = fh.read()
        for r in refs(text):
            target = resolve(root, f, r)
            if target and target not in reached:
                todo.append(target)

    # Delete the rest.
    before = after = 0
    removed = 0
    for d, _, files in os.walk(root):
        for name in files:
            rel = os.path.normpath(os.path.relpath(os.path.join(d, name), root))
            size = os.path.getsize(os.path.join(root, rel))
            before += size
            if rel in reached or rel in KEEP:
                after += size
            else:
                os.remove(os.path.join(root, rel))
                removed += 1
    for d, dirs, files in sorted(os.walk(root, topdown=False), key=lambda x: -len(x[0])):
        if d != root and not os.listdir(d):
            os.rmdir(d)

    # Keep the manifest in step: drop resources and <file>s that are gone.
    for res in list(resources):
        href = res.get("href")
        if href and os.path.normpath(unquote(href)) not in reached:
            resources.remove(res)
            continue
        for f in list(res.findall(f"{{{NS}}}file")):
            if os.path.normpath(unquote(f.get("href"))) not in reached:
                res.remove(f)
    ET.indent(tree, space="  ")
    tree.write(manifest_path, encoding="UTF-8", xml_declaration=True)

    mb = 1024 * 1024
    print(f"pruned {removed} unused files: {before / mb:.1f} MB -> {after / mb:.1f} MB")


if __name__ == "__main__":
    main(sys.argv[1])
