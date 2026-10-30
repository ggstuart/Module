# Module theme for HUGO

This is a HUGO theme for module content.

## Features

The theme allows you to create **units** of content which have:

- lecture slides
- coding exercises

## Learning Zone export

Any site that uses this theme can also be built as a **course package** for
DMU Learning Zone (Brightspace). The package is a zip file in the IMS Common
Cartridge 1.1 format, the same shape as Simon Coupland's
[MarkdownToLZ](https://github.com/SimonCouplandDMU/MarkdownToLZ), which has
been tested with Learning Zone.

- Each **unit** (a top-level section with `type: unit`) becomes a folder in
  Learning Zone, in `weight` order. Its own page becomes an "Overview" topic.
- Each lecture, exercise or other page in the unit becomes a topic, in
  `weight` order, titled from its front matter `title`.
- Lectures stay slide decks (arrow keys, on-screen buttons, full screen), and
  exercises keep their contents list and copy buttons.
- Pages are shown without the site header, menu, breadcrumbs and footer,
  because Learning Zone has its own navigation.
- Everything the pages need (CSS, JavaScript, images, HTML examples, the web
  fonts and, if a page uses it, Mermaid) is inside the zip. Static files and
  assets that no page uses are left out, to keep the zip small.

The export is opt-in. A normal `hugo` build is not affected.

### Build it with GitHub Actions (recommended)

Add this file to the site's repository as
`.github/workflows/learning-zone.yml`:

```yaml
name: Learning Zone package
on:
  workflow_dispatch:        # adds a "Run workflow" button on the Actions tab
  push:
    branches: [main]

jobs:
  package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          submodules: recursive
      - uses: ggstuart/Module/.github/actions/learning-zone@2026-27   # see "Pinning the action" below
```

Each run puts `course-package.zip` on the run's summary page (under
Artifacts). Download it and import it into Learning Zone as it is.

Optional inputs:

| input | default | meaning |
| --- | --- | --- |
| `hugo-version` | `0.169.0` | Hugo (extended) to install, or `''` to use one already installed |
| `site-directory` | `.` | where the site is in the repository |
| `package-name` | `course-package.zip` | name of the zip |
| `release-tag` | | also attach the zip to this existing release (needs `permissions: contents: write`) |
| `upload-artifact` | `true` | upload the zip as a workflow artifact |
| `offline` | `false` | `true` = don't download the web fonts and Mermaid (system fonts, diagrams shown as text) |
| `keep-unused-files` | `false` | `true` = keep every static file and asset, even those no page uses |
| `home-outputs` | `["lz", "slideLayouts", "imsmanifest"]` | the home page outputs for the package build |

#### Pinning the action

`@2026-27` follows the theme's branch, so a change to the theme can change
the next package without any change in your repository. To make the build
repeatable, pin the action to a release tag or a full commit SHA instead,
and use the same version as the theme submodule your site uses (the action
and the templates are made to work together):

```yaml
      - uses: ggstuart/Module/.github/actions/learning-zone@v2026.1        # a release tag (example name)
      - uses: ggstuart/Module/.github/actions/learning-zone@3f1c9e2...     # or a commit SHA
```

`git -C themes/module rev-parse HEAD` prints the commit your submodule is on.
When you update the submodule, update the version here too. (Dependabot can
open pull requests for both: use the `gitsubmodule` and `github-actions`
ecosystems.)

The action also checks the package: it fails if the manifest names a file
that is missing, warns about links that would break (including iframes and links that
land on the home page, the usual sign of a path the theme couldn't resolve), and lists the websites
the pages still load from the internet (YouTube embeds, for example). It also
fails if the web fonts or Mermaid can't be downloaded, rather than quietly
making a package without them; set `offline: true` to build without them.

### Build it on your own computer

The simplest way, in a terminal (on Windows, *Git Bash*) in the site's folder,
is the same script the GitHub Action uses:

```sh
bash themes/module/.github/actions/learning-zone/build.sh course-package course-package.zip
```

This builds the package into the folder `course-package`, removes unused
files, checks it, and zips the folder's contents into `course-package.zip`
(with `imsmanifest.xml` at the top of the zip, as Learning Zone needs). It
needs bash, Hugo (extended) and Python 3; without Python the package is not
made smaller or checked. `LZ_OFFLINE=true bash ...` builds without
downloading the fonts and Mermaid, and `LZ_PRUNE=false` keeps every file.

Or, to use plain Hugo commands, add a file `config/learningzone/hugo.toml`
to the site (next to `content/`):

```toml
# Settings for `hugo --environment learningzone` (the Learning Zone package).
baseURL = "/"
relativeURLs = true
disableKinds = ["taxonomy", "term", "rss", "sitemap", "robotsTXT", "404"]

# Only needed if your hugo.toml sets [outputs] home = [...] itself:
[outputs]
  home = ["lz", "slideLayouts", "imsmanifest"]

# Allow the downloads the package needs (web fonts and Mermaid).
[security.http]
  urls = ['^https://fonts\.googleapis\.com/', '^https://fonts\.gstatic\.com/', '^https://cdn\.jsdelivr\.net/npm/mermaid@']
```

(A site whose `hugo.toml` has `[outputs] _merge = 'deep'` and no `home`
line of its own gets the home outputs from the theme, and can leave the
`[outputs]` part out.)

Then build into a folder and zip that folder's *contents*:

```sh
hugo --environment learningzone --destination course-package
cd course-package && zip -r ../course-package.zip . && cd ..
```

On Windows (PowerShell) the zip step is
`Compress-Archive -Path course-package\* -DestinationPath course-package.zip`.

This plain Hugo build includes every static file and asset (it works, but the
zip is bigger than the script's).

`hugo server --environment learningzone` previews the package version of the
pages. The build needs internet access the first time, to download the web
fonts (and Mermaid), and fails if it can't. To build without them, set
`offline = true` under `[params.learningzone]`.

### Import it into Learning Zone

1. In your Learning Zone module, open **Module Tools > Course Admin >
   Import/Export/Copy Components**.
2. Choose **Import Components** from a course package and upload
   `course-package.zip`.
3. Press **Import All Components** and wait. A new folder named after the
   module (`moduleCode: moduleName`) appears in Content.

An import is a snapshot. When the materials change, build a new package and
import it again (or link to the live website instead).

### Options

In the site's `hugo.toml`:

```toml
[params.learningzone]
  title = "CTEC2712 Web application development"   # top folder name
  includeHome = true          # first topic is the home page ("About this module")
  homeTitle = "About this module"
  sectionPageTitle = "Overview"   # title of each unit's own page
  sectionType = "unit"        # "" = every top-level section, not only units
  offline = false             # true = don't download web fonts or Mermaid
  mermaidURL = "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js"

The web fonts come from the `@import` of Google Fonts at the top of the
theme's `static/css/style.css`, so there is only one place to change them.
```

In a page's front matter:

```yaml
learningzone:
  exclude: true      # leave this page (or section) out of Learning Zone
  title: Week 1      # a different title in Learning Zone
```

### How it works

All of it is in files used only by `hugo --environment learningzone`:

- `config/learningzone/hugo.toml` defines the `lz` page format and the
  `imsmanifest` format, and the default options.
- `layouts/_default/baseof.lz.html` is the page shell without site
  navigation. It reuses the normal layouts (`lecture/single.html`,
  `exercise/single.html`, ...) for the content.
- `layouts/_default/home.imsmanifest.xml` writes `imsmanifest.xml` from the
  section tree, and the `imscc.xml` marker file.
- `layouts/partials/learningzone/` holds the helpers, and
  `assets/learningzone/` the extra CSS and JavaScript for pages inside a frame.
- `.github/actions/learning-zone/` is the GitHub Action: `build.sh` (build,
  then `prune_package.py` to drop unused files, then `check_package.py`, then
  zip) and `action.yml`.

Known limits: links to pages on the live website, YouTube embeds and images
hot-linked from other sites still need internet access. Links between pages
that point at a folder (`../hello-world/`) are fixed up by a small script in
the page, so they need JavaScript. Links written as `//unit/page/` (a site
link a template has turned into `//...`) don't work in Learning Zone; the
check lists them.
