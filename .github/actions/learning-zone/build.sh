#!/usr/bin/env bash
# Build the Learning Zone package of a Hugo site that uses the Module theme.
#
#   build.sh OUTPUT_DIR [ZIP_FILE]
#
# Run it from the site's folder. It is what the GitHub Action runs, and works
# the same on your own computer (bash, Hugo 0.165+ extended, python3 for the
# size reduction and checks, zip or python3 for the zip).
#
# Environment variables (all optional):
#   LZ_HOME_OUTPUTS  home page outputs, default ["lz", "slideLayouts", "imsmanifest"]
#   LZ_OFFLINE       "true" = don't download web fonts or Mermaid
#   LZ_PRUNE         "false" = keep every static file and asset in the package
set -euo pipefail

out="${1:?usage: build.sh OUTPUT_DIR [ZIP_FILE]}"
zip_file="${2:-}"
home_outputs="${LZ_HOME_OUTPUTS:-[\"lz\", \"slideLayouts\", \"imsmanifest\"]}"
offline=false; if [ "${LZ_OFFLINE:-false}" = "true" ]; then offline=true; fi
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::$1::$2"; else echo "$1: $2" >&2; fi; }

# Settings Hugo only accepts from the site itself go in an extra config file
# that is layered on top of the site's own (right-most wins).
overrides="$(mktemp -d)/learningzone.toml"
cat > "$overrides" <<TOML
baseURL = "/"
relativeURLs = true
disableKinds = ["taxonomy", "term", "rss", "sitemap", "robotsTXT", "404"]
[outputs]
  home = ${home_outputs}
[params.learningzone]
  offline = ${offline}
# The only downloads the package build makes (web fonts and Mermaid).
[security.http]
  urls = ['^https://fonts\.googleapis\.com/', '^https://fonts\.gstatic\.com/', '^https://cdn\.jsdelivr\.net/npm/mermaid@']
TOML

config=""
for f in hugo.toml hugo.yaml hugo.yml hugo.json config.toml config.yaml config.yml config.json; do
  if [ -f "$f" ]; then config="$f,"; break; fi
done

rm -rf "$out"
hugo --environment learningzone --config "${config}${overrides}" --gc --destination "$out"

if [ ! -f "$out/imsmanifest.xml" ]; then
  say error "No imsmanifest.xml was produced. Is the site's theme a version of the Module theme that includes the Learning Zone export (config/learningzone/hugo.toml)? Update the theme and try again."
  exit 1
fi

if command -v python3 >/dev/null; then
  if [ "${LZ_PRUNE:-true}" != "false" ]; then python3 "$here/prune_package.py" "$out"; fi
  python3 "$here/check_package.py" "$out"
else
  say warning "python3 not found: the package was not made smaller or checked."
fi

if [ -n "$zip_file" ]; then
  case "$zip_file" in /*) ;; *) zip_file="$PWD/$zip_file" ;; esac
  rm -f "$zip_file"
  # Zip the folder's contents, so imsmanifest.xml sits at the root of the zip.
  if command -v zip >/dev/null; then
    (cd "$out" && zip -q -r -X "$zip_file" .)
  elif command -v python3 >/dev/null; then
    (cd "$out" && python3 -c 'import os, sys, zipfile
with zipfile.ZipFile(sys.argv[1], "w", zipfile.ZIP_DEFLATED) as z:
    for d, _, fs in os.walk("."):
        for f in sorted(fs):
            p = os.path.join(d, f)
            z.write(p, os.path.relpath(p, "."))' "$zip_file")
  else
    say error "Neither zip nor python3 is installed, so the folder $out was not zipped."
    exit 1
  fi
  echo "created $zip_file ($(du -h "$zip_file" | cut -f1))"
fi
