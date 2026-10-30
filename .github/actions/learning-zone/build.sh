#!/usr/bin/env bash
# Build the Learning Zone version of a Hugo site that uses the Module theme.
#
#   build.sh OUTPUT_DIR [HOME_OUTPUTS]
#
# Run it from the site's folder. It is what the GitHub Action runs, and works
# the same on your own computer (bash, Hugo 0.165+ extended).
# HOME_OUTPUTS defaults to ["lz", "slideLayouts", "imsmanifest"].
set -euo pipefail

out="${1:?usage: build.sh OUTPUT_DIR [HOME_OUTPUTS]}"
home_outputs="${2:-[\"lz\", \"slideLayouts\", \"imsmanifest\"]}"

# Settings Hugo only accepts from the site itself, so they go in an extra
# config file that is layered on top of the site's own (right-most wins).
overrides="$(mktemp -d)/learningzone.toml"
cat > "$overrides" <<TOML
baseURL = "/"
relativeURLs = true
disableKinds = ["taxonomy", "term", "rss", "sitemap", "robotsTXT", "404"]
[outputs]
  home = ${home_outputs}
TOML

config=""
for f in hugo.toml hugo.yaml hugo.yml hugo.json config.toml config.yaml config.yml config.json; do
  if [ -f "$f" ]; then config="$f,"; break; fi
done

rm -rf "$out"
hugo --environment learningzone --config "${config}${overrides}" --gc --destination "$out"

if [ ! -f "$out/imsmanifest.xml" ]; then
  msg="No imsmanifest.xml was produced. Is the site's theme a version of the Module theme that includes the Learning Zone export (config/learningzone/hugo.toml)? Update the theme and try again."
  if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::error::$msg"; else echo "error: $msg" >&2; fi
  exit 1
fi
