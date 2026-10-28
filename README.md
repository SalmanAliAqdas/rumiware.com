# Rumiware

A static website for Rumiware, a small software team in Lahore. The site uses HTML, CSS and vanilla JavaScript. A small **Node-only build script** assembles complete pages from shared layout and JSON data. There is no framework, database, account system, runtime server requirement or browser-side layout fetching.

Publish **only the contents of `dist/`** after a separate release review. The checked-in workflow runs verification only. GitHub Pages and external hosting settings must be reviewed separately before any push; see `verification/RELEASE-READINESS.md`.

## Getting started

Use Node.js 24 or newer. Browser tests use the existing Playwright development dependencies.

```powershell
npm.cmd ci --cache .npm-cache
npm.cmd run build
npm.cmd run preview
```

On macOS/Linux use `npm` instead of `npm.cmd`. Preview opens at:

- Production-root layout: `http://127.0.0.1:4174/`
- GitHub Pages layout: `http://127.0.0.1:4174/rumiware.com/`
- Actual local 404 examples: `/missing/nested/page` and `/rumiware.com/missing/nested/page`

Preview builds once when started. After editing a source file, run `npm.cmd run build` and refresh the browser. Stop preview with Ctrl+C. Tests use a separate port, 4173.

## Folder structure

```text
src/
  layout/document.html     Shared head, metadata, theme bootstrap and document wrapper
  layout/header.html       Shared header
  layout/footer.html       Shared footer, contact alternatives and privacy controls
  pages/*.html             Page-specific main content (no duplicated head/header/footer)
  assets/style.css         Shared styles, fonts and design tokens
  assets/script.js         Theme, navigation, forms and optional enhancements
  assets/robot.svg         Existing brand mascot
  data/site.json           Domain, preview mount, navigation, contact details, form actions
  data/pages.json          Titles, descriptions and additional structured metadata
  data/projects.json       Nine owner-supplied project records
  data/services.json       Service cards, service names, features and overview links
  data/team.json           Names, roles, descriptions and verified profile links
  data/pricing.json        Existing package prices, scope, support and quote descriptions
  data/commercial.json     Shared payment, support and separate-cost explanations
  data/faq.json            FAQ text and references to shared commercial explanations
  data/icons.json          Small inline SVG icon set
  data/portraits.json      Generated portrait dimensions and file sizes
  dev/                     Preserved development references; never copied to dist
images/
  *.jpeg                   Original portraits, retained; not copied to dist
  portraits/*.webp         Optimized portraits used by the site
  projects/                Authentic screenshots and labelled project covers
  fonts/                   Two local variable WOFF2 files and their OFL licenses
  favicon.png              Existing favicon
  social-preview.*         Existing branded sharing image and editable SVG
reference/
  phase2/                  Exact pre-Phase-3 page/CSS/JS snapshots
  mani-bakes/              Read-only public project source used for the authentic preview
  project-captures/        Original screenshot capture
scripts/                   Build, checks and optional asset/evidence tools
tests/                     Phase 1, Phase 2 and Phase 3 browser tests
verification/              Reports, measured results and screenshots; never published
dist/                      Generated static release output; ignored by Git
```

The old root-level HTML/CSS/JS files were relocated to `reference/phase2/` after checking that every archived copy matched its working-tree contents. Edit `src/`, not the reference copies or `dist/`.

## What to edit

### Shared navigation and contact information

Edit `src/data/site.json`. A navigation item has a `file`, `label`, and flags such as `main`, `company` or `service`. The builder uses that single item in the relevant header/footer list and adds the current-page indication automatically.

The same file holds public contact details, business hours, the production domain, preview host/path and the two public Formspree actions. Never put SFTP passwords, private API keys or account credentials in this file or in browser code.

For shared markup edit `src/layout/`. Templates use simple named markers such as `{{EMAIL}}`; unknown markers fail the build. There is no browser fetch for shared HTML.

### Pages and metadata

Edit the main content in `src/pages/<page>.html`. Edit that page's title/description in `src/data/pages.json`. The builder uses these for the document title, description, Open Graph metadata and production canonical. Additional article schema stays in that metadata file. The sitemap is generated from public pages; 404 and development previews are excluded.

To add a public page, add both a page body and a metadata entry. Use a lowercase `.html` filename and relative internal links. Add it to navigation only if needed. Do not invent publication dates or results.

### Projects

Edit `src/data/projects.json`. `visible` controls publication; `featured` selects homepage cards. Keep IDs stable because homepage links target `portfolio.html#<id>`. Categories and filter controls come from the same records. Status is owner-provided development status, not a certification. Do not add individual attribution or invented repositories.

The nine supplied projects use authentic public-screen captures. The six Streamlit previews are optimized WebP screenshots in 640px and 1280px variants; original PNG captures stay outside the release. Earlier labelled covers remain recoverable but are no longer published. Image dimensions, alternatives and captions live in each record. Only publish safe captures without personal records or credentials; keep originals in `reference/project-captures/`. The read-only `scripts/capture-portfolio-public.cjs` captures the approved public sign-in, fictional examples and game-start screens without using controls. Review new captures before publishing. `scripts/capture-streamlit.cjs` captures the six approved public overview states (only the harmless Rumiware URL is entered for QR generation); `python scripts/optimize-project-previews.py` regenerates WebP variants. Portfolio images open a larger accessible preview without a gallery. See `verification/PORTFOLIO-SCREENSHOTS.md` for current evidence and inspection limits.

The former two project records are preserved in `reference/portfolio-before-nine-projects.json`; their original source/assets remain recoverable outside the generated listing. The enquiry-workflow entry is now named Rumi Enquiry Assistant; its supplied URL and `portfolio-demo` anchor remain stable. See `verification/RELEASE-READINESS.md` for the current release decision and `verification/PORTFOLIO-UPDATE.md` for historical inspection evidence.

### Services, team and pricing

- Edit `src/data/services.json` for homepage cards and the service overview. `featured` controls homepage placement. Edit longer service-specific page content in `src/pages/`.
- Edit `src/data/team.json` for names, roles, descriptions and profile URLs. Keep verified identities intact. A null profile is hidden; do not use a social network homepage as a profile.
- Edit `src/data/pricing.json` for prices, scope, support periods and package summaries. Prices remain PKR 50,000, PKR 150,000 and Custom. The quote form reads its package allowlist and description from the same generated data.
- Edit `src/data/commercial.json` for the shared support/payment/separate-cost explanations. FAQ entries with a `commercial` key use that explanation in both visible text and structured data.

Support boundaries and payment milestones must be confirmed in the written quote. Do not add guarantees or fees without owner approval. Site analytics remain disabled independently of any analytics service discussed with a client.

### Design, icons and portraits

Spacing and component styling live in `src/assets/style.css`; preserve both theme token sets and reduced-motion rules. SVG path definitions live in `src/data/icons.json`. Use `{{icon:code}}` (or another existing icon name) in page templates.

Optimized portraits are already included, so ordinary builds do not need Python or an image package. To regenerate them from the retained originals, optionally install Pillow and run:

```powershell
python -m pip install Pillow
python scripts/optimize-images.py
npm.cmd run build
```

This preserves orientation and aspect ratio and updates the intrinsic-dimension manifest. Do not edit the original faces or replace them with generated portraits. To regenerate the existing sharing image with the current mascot, run `npm.cmd run social-image`, then rebuild.

Fonts are served locally: Bricolage Grotesque uses weights 600–800 and DM Sans 400–700. Their OFL files are copied beside the fonts in the release. Latin subsets cover the site's English content; other characters use system fallbacks.

## Checks

```powershell
npm.cmd run build
npm.cmd run check

# Keep new captures separate from the earlier reports.
$env:RUMIWARE_SCREENSHOTS_DIR = 'verification/phase3/phase1-regression'
$env:RUMIWARE_PHASE2_SCREENSHOTS_DIR = 'verification/phase3/phase2-regression'
npm.cmd test
```

`check` validates generated HTML, internal links/anchors, assets, duplicate IDs, image dimensions/alt text, metadata, concrete form actions, disabled analytics and release exclusions. Browser tests cover all three phases, both hosting layouts, keyboard access, forms with mocked responses, disabled JavaScript, storage failures, contrast, accessibility scans and responsive layouts.

On Windows, tests use installed Chrome by default. Set `CHROME_PATH` for another Chromium executable. On Linux/macOS install the Playwright browser with `npx playwright install chromium`; CI uses `--with-deps`. Tests start/stop their own QA server on 4173. The old quote-preview URL exists **only in that QA server** to retain its regression coverage; it is not a release file. Use `npm.cmd run test:phase1` or `npm.cmd run test:phase2` after building for individual suites.

The GitHub Actions workflow runs build, static checks and browser regressions with read-only repository permissions. It uploads failure evidence, not a deployment. The workflow file has been checked locally but will run remotely only after a later authorized push.

Optional evidence tools (run against an existing preview):

```powershell
node scripts/capture-phase3.cjs after
node scripts/measure-performance.cjs
```

These record local screenshots/resource measurements. Public project capture is a separate read-only tool, `scripts/capture-projects.cjs`, and can fail because of network restrictions. It never submits forms. Do not treat automated scores or local measurements as production field performance or complete accessibility certification.

## Hosting and release preparation

All essential page content and navigation is already in the generated HTML. Upload the **contents of `dist/`**, including images, fonts, robots.txt, sitemap.xml, 404.html and `.nojekyll`, using the hosting provider's normal static upload process.

- Production uses `https://rumiware.com/` at the domain root.
- The existing GitHub Pages preview uses `https://salmanaliaqdas.github.io/rumiware.com/`. Existing public deployment records show `main` publishing to GitHub Pages. Do not merge/push this source migration to that publishing branch until Pages is separately configured to publish built `dist/` contents (an authorized custom build workflow or a dedicated output branch). The checks workflow does not deploy. See `verification/RELEASE-READINESS.md`.
- Asset/page links are relative. The 404 document chooses the configured repository mount for its preview host or matching local path; otherwise it uses `/`. Missing routes are not redirected to the homepage. Without JavaScript, 404 recovery links use the production domain.
- Canonicals always point to the verified production domain. The builder does not add a CNAME or alter domain settings, so it does not turn the repository preview into a redirect.
- For a different preview repository, update `previewHost` and `previewPath` in `site.json`; the builder and local server share these settings. Run both hosting checks before release.

The existing local `.vscode/sftp.json` was retained locally and removed from Git tracking. It stays ignored and is never copied into public output. The sanitized `.vscode/sftp.example.json` disables upload-on-save. The release review inspected only non-secret upload settings; it did not expose login details. Configure any local upload tool to publish `dist/` only, after review. Git history was not rewritten.

Before any later release, review `verification/PHASE3.md`, build and run checks, inspect `dist/`, confirm owner facts/provider settings and review both themes. Creating `dist/` is release preparation, not permission to deploy. Nothing in these commands pushes, merges or deploys.

## Remaining owner configuration

- Confirm Formspree recipients, allowed domains, spam handling and actual message delivery for the preserved contact and quote endpoints. Tests use mocks and send no production messages.
- Newsletter signup remains unavailable. A real mailing-list destination, sender verification, opt-in/confirmation and unsubscribe behavior are needed before restoring it; never reuse enquiry endpoints.
- Retired project information remains archived. Any future project restoration, new measured outcome or additional social-profile URL needs approved evidence.
- Optional analytics remain off. Re-enabling them would require a separately reviewed consent integration and matching privacy wording.

## Verification evidence in Git

Reports, structured results, logs, original project captures and the twelve final portfolio/homepage screenshots are retained in Git. Downloaded third-party research HTML and repeated intermediate/batch verification PNGs remain local and ignored to avoid committing redundant image output; their paths in historical reports refer to that local evidence. The release includes none of these verification files.
