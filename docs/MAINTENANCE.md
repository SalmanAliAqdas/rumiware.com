# Maintenance guide

## Source and generated output

The dependency-free static builder in `scripts/build.cjs` reads shared templates, page bodies, and JSON content from `src/`. It writes complete HTML documents and selected assets into `dist/`.

`dist/` is generated and ignored by Git. `reference/`, `verification/`, development fragments, and local editor configuration are not copied into the website output.

## Content locations

| Content | Source |
| --- | --- |
| Contact details, navigation, preview mount, public form endpoints | `src/data/site.json` |
| Page titles, descriptions, additional structured data | `src/data/pages.json` |
| Canonical directory URLs and stable source page mapping | `src/data/routes.json` |
| Project records, filters, previews, homepage selection | `src/data/projects.json` |
| Services | `src/data/services.json` |
| Team profiles | `src/data/team.json` |
| Pricing and package summaries | `src/data/pricing.json` |
| Shared payment, support, and cost descriptions | `src/data/commercial.json` |
| FAQ entries | `src/data/faq.json` |
| SVG icon definitions | `src/data/icons.json` |
| Portrait dimensions | `src/data/portraits.json` |
| Shared document, header, and footer | `src/layout/` |
| Individual page bodies | `src/pages/` |
| Theme tokens, layouts, and components | `src/assets/style.css` |
| Navigation, forms, preferences, and enhancements | `src/assets/script.js` |

The template engine supports named markers such as `{{EMAIL}}` and icon markers such as `{{icon:code}}`. Unknown template values fail the build.

A public page requires both its body in `src/pages/` and metadata in `src/data/pages.json`. Sitemap entries are generated from those pages; the 404 page is excluded.

## Portfolio and images

Project visibility and homepage selection use the `visible` and `featured` fields. IDs also form project anchors, so changing an ID requires updating links that target it. Categories and filters are generated from the same records.

Published image files, dimensions, alternatives, and captions are specified in the project records. Streamlit previews have 640px and 1280px WebP variants. Original captures are retained in `reference/project-captures/`. Retired project records remain in `reference/portfolio-before-nine-projects.json`.

Optional image-generation commands:

```bash
python scripts/optimize-project-previews.py
python scripts/optimize-images.py
npm run social-image
npm run build
```

The Python image tools require Pillow. Ordinary website builds use the included assets and do not require Python.

Fonts are served locally. Font license files are included beside the WOFF2 assets.

## Local commands

```bash
npm ci
npm run preview
npm run build
npm run check
npm test
```

Preview uses port 4174 and supports both the root and configured repository mount. Rebuild after edits; the preview does not watch source changes automatically.

Playwright starts its QA server on port 4173. On Windows it uses installed Chrome by default. Other platforms use the installed Playwright Chromium browser. `CHROME_PATH` overrides the browser executable.

Optional screenshot destinations can be set using `RUMIWARE_SCREENSHOTS_DIR` and `RUMIWARE_PHASE2_SCREENSHOTS_DIR` to retain earlier verification captures.

## GitHub Pages

`.github/workflows/pages.yml` runs on pushes to `main` and supports manual dispatch. It:

1. Installs dependencies using the lockfile.
2. Builds and statically checks the website.
3. Waits for any legacy Pages publisher for the same commit to finish.
4. Uploads only `dist/` as the Pages artifact.
5. Deploys to the `github-pages` environment.

The wait prevents the legacy branch publisher from replacing the built site with repository source. If Pages is configured to use GitHub Actions directly and no legacy run exists, the workflow proceeds after its detection interval.

`.github/workflows/checks.yml` separately runs the browser regression suite and uploads failure evidence when needed.

The repository-path site is `https://salmanaliaqdas.github.io/rumiware.com/`. Relative asset links support that mount. The 404 page selects its configured preview base at runtime; its no-JavaScript recovery links target the production domain.

Canonical metadata uses the domain configured in `site.json`. The build does not add a CNAME or modify DNS.

## External hosting

External hosting uses the **contents of `dist/`**, including images, fonts, sitemap, robots.txt, 404.html, and .nojekyll. Source, reports, tests, and configuration files are not deployment payloads.

Hostinger publication is separate from GitHub Pages. Local SFTP settings are ignored by Git; `.vscode/sftp.example.json` is the sanitized configuration example.

`.github/workflows/hostinger.yml` deploys automatically on pushes to `main` and
also supports manual dispatch. It runs the release checks, verifies SSH identity
and the exact destination, and verifies a complete backup before uploading.
See the [Hostinger deployment and recovery guide](HOSTINGER.md) for safeguards
and restore instructions.

## Forms and privacy

The contact and quote forms use public Formspree endpoints configured in `site.json`. Provider-side recipients, allowed domains, spam controls, and inbox delivery require separate operational verification. Browser tests intercept submissions rather than sending production messages.

Newsletter subscriptions remain unavailable until a dedicated mailing-list integration is configured. Google Analytics uses a versioned consent-first preference and is restricted to production public pages. See [ANALYTICS.md](ANALYTICS.md) for implementation, verification and required dashboard settings. Privacy settings and essential theme preferences remain available.

## Verification records

Reports and supporting evidence are retained in `verification/`. They describe the implementation and test conditions at the time of each review; current workflow results are the source for the latest CI status.

Selected reports:

- [Release readiness](../verification/RELEASE-READINESS.md)
- [Portfolio update](../verification/PORTFOLIO-UPDATE.md)
- [Portfolio screenshots](../verification/PORTFOLIO-SCREENSHOTS.md)

Local checks and mocked form tests do not establish live inbox delivery or the behavior of separately hosted application backends.

## Clean URL release and recovery

Public pages use directory URLs. Keep source page IDs stable and edit `src/data/routes.json` for public routes. See [CLEAN-URL-MIGRATION.md](CLEAN-URL-MIGRATION.md) for the full mapping, verified backup, Hostinger redirect configuration, verification boundary and targeted rollback procedure. Asset extensions remain unchanged.
