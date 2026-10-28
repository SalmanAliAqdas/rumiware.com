# Phase 3: Maintainability, visual polish and sales clarity

Implemented locally on `phase-1-production-readiness`, preserving the previous working-tree implementation in `reference/phase2/`. Applicable instruction locations were checked; no AGENTS.md was found. Read both prior phase reports, the regression tests and the current pages before editing. No push, merge, deployment, account-setting change or Git-history rewrite was performed.

## 1. Implemented changes and design decisions

### One source for shared content; complete static output

There was no existing template/build setup. Headers, footers, contact details, metadata and provider actions were copied through the pages. A small Node-only builder now combines:

- `src/layout/`: shared document head, header and footer;
- `src/pages/`: page-specific main content;
- `src/data/`: shared navigation/contact/provider settings, page metadata, services, projects, pricing, team profiles, FAQs and commercial explanations;
- `src/assets/` and selected files from `images/`.

`node scripts/build.cjs` creates **20 complete public HTML pages** in `dist/`. Navigation and content do not depend on browser fetching. No framework or new npm dependency was added. The server remains a local development tool; the release needs only ordinary static hosting.

The original 24 root HTML files, CSS, JavaScript, robots.txt and sitemap.xml were copied into `reference/phase2/` and compared byte-for-byte before relocation. Existing Phase 1/2 behavior was carried into the new sources. Development fragments and quote-preview references are excluded from `dist/`. The old quote-preview URL is supported only by the QA server so its provider-response regression tests still run; it intentionally returns 404 in the ordinary release preview.

All content-page `.html` URLs remain the same. Relative links support both the production root and `/rumiware.com/` preview mount. The special 404 base handling and JavaScript-free production recovery remain; no redirect or CNAME configuration was added. Production canonicals stay on `https://rumiware.com/`.

The local `.vscode/sftp.json` was not read or copied. It remains on disk, is ignored and was removed only from Git's index. That removal is staged; other work remains uncommitted. A sanitized example disables upload-on-save. Git history was not rewritten. The generated-output allowlist excludes `.vscode`, reference files, tests, configuration sources and verification artifacts.

### Homepage polish

The navy/teal/gold identity, mascot, heading message and both themes remain. The robot now has intrinsic dimensions and a bounded 220px desktop/120px mobile presentation. The hero has a clear enquiry action and a quieter portfolio link.

Two named project records now follow the hero. Website work leads the service presentation, while the existing app/full-stack/AI capabilities remain available for discussion. The four repetitive benefit cards and six homepage process cards were replaced with a concise three-step process summary linked to the detailed process page. Team identities and portraits remain visible.

Spacing, borders, heading wrapping, card alignment and responsive layouts use shared tokens. Card hover movement was removed; essential content still defaults to visible, and reduced-motion and keyboard-focus behavior remain. Focused forms temporarily hide floating contact/back-to-top controls so they do not cover inputs. Extra footer clearance keeps the final links away from the floating contact control.

### Project evidence and honest presentation

Only **Mani Bakes** and **Rumi Dental Care** are published as project records. Four sample projects remain in the archived references but are absent from the release. Homepage buttons point to exact portfolio anchors.

**Mani Bakes:** the connected GitHub source verified the public [Rumi-Ware/Mani-Bakes repository](https://github.com/Rumi-Ware/Mani-Bakes), including its existing Pages URL. The deployed Pages demo timed out during both HTTP/browser checks. Instead of claiming a successful live capture, the displayed image is an authentic local rendering of the unchanged public source, clearly captioned as a source preview. The original screenshot and source are retained outside the output. The public button links to the verified repository. Its menu, product selection, order brief and WhatsApp handoff are visible in the real source; no backend checkout or measurable business result was invented.

**Rumi Dental Care:** the existing [clinic URL](https://rumidentalcare.com/) returned HTTP 200 after redirecting from `www`. Its page contains procedure information, clinic contact/location and telephone appointment links. Browser screenshot capture returned HTTP 403, so no dental screenshot is displayed. Its Rumiware attribution remains based on the existing portfolio record; detailed individual contributions and outcomes still need owner confirmation. No success metrics or additional integrations were added.

The concrete `Rumi-Ware` organization link was retained and verified; its difference from the repository owner's username was not treated as an error. Generic LinkedIn/GitHub homepage links were removed. Existing concrete team profile links were retained after successful read-only URL checks.

Evidence: [external HTTP checks](phase3/external-checks.json), [browser capture attempts](phase3/project-evidence.json), [Mani source-preview record](phase3/mani-preview.json).

### Sales wording and commercial consistency

Enquiry links now say **“Request a consultation”**. Brand spelling, FastAPI capitalization, full-stack terminology, team roles and business-hour presentation are standardized in their shared records.

Prices remain **PKR 50,000**, **PKR 150,000** and **Custom**. Existing one-month Starter and three-month Business support periods remain; Enterprise / Custom still has a monthly support plan. Scope, payment milestones and separate costs are explained without adding a guarantee, a new fee or a new support period. The generic “most popular” badge and unsupported customer-upgrade claim were removed.

Pricing, the quote-package allowlist/descriptions and FAQ commercial answers use the same data. FAQ structured data is generated from the visible answers. The web-development page points to the same scope/support explanation. Client analytics configuration is described as something to agree in a quote; **this website's optional analytics remain disabled**.

Contact action `mvkzkdbv` and quote action `mkjojozj` are preserved in the single configuration source. Newsletter controls remain absent, with honest availability messages and email/WhatsApp alternatives. Form timeout, duplicate protection, accessible feedback, complete-brief validation and retained failure values remain.

### Assets and fonts

- A small inline SVG icon set replaces the inconsistent emoji UI. The existing brand robot and sharing asset remain genuine vector brand artwork. The authentic project screenshot is not edited to change that project's own design.
- The four original JPEG portraits are retained. WebP versions preserve orientation, aspect ratio and identity, with intrinsic dimensions and meaningful alt text in the generated markup.
- Original portrait files total **1,371,849 bytes**; WebP versions total **28,570 bytes**, about **97.9% less**. The originals are not copied into the release.
- Bricolage Grotesque and DM Sans are served locally as two licensed Latin variable WOFF2 files, totaling **78,276 bytes**. Header weights are 600–800, body weights 400–700; `font-display: swap` remains. Both families loaded successfully in Chrome. The privacy page now describes local fonts rather than Google Fonts requests. OFL licenses are included with the output.
- Favicon references and the 1200 × 630 sharing image are generated consistently from shared layout/configuration.

### Documentation and CI

The new [README](../README.md) explains the source/output structure, beginner editing locations, build/preview/test commands, form setup, project evidence, both hosting layouts and release preparation without deployment.

The read-only GitHub Actions workflow builds, validates and runs the browser regressions. Static checks cover HTML validity, missing files/anchors, duplicate IDs, image dimensions/alt text, provider placeholders, required public metadata, disabled analytics and release exclusions. Official action release metadata was checked before selecting their v7 major versions: [checkout](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup-node](https://github.com/actions/setup-node/releases/tag/v7.1.0), [upload-artifact](https://github.com/actions/upload-artifact/releases/tag/v7.0.2). The workflow has not been pushed or run on GitHub.

## 2. Files changed and dependencies

Changes below are relative to the Phase 2 working tree; the Git diff still also includes the earlier uncommitted phases.

| Location | Change |
| --- | --- |
| `reference/phase2/*` | Exact relocation of the old 24 HTML files, CSS/JS, robots and sitemap |
| `src/layout/*.html` | Three shared layout templates |
| `src/pages/*.html` | Twenty public page bodies, preserving URLs and previous functionality |
| `src/data/*.json` | Central editable site/navigation, metadata, project, service, team, pricing, FAQ, commercial, icon and portrait records |
| `src/assets/style.css`, `script.js`, `robot.svg` | Previous runtime behavior plus scoped polish and shared package configuration |
| `images/portraits/*.webp`, `images/projects/mani-bakes.webp` | Optimized real images and authentic source-preview capture |
| `images/fonts/*` | Two WOFF2 files and OFL licenses |
| `reference/mani-bakes/*`, `reference/project-captures/*` | Public project-source/capture references, excluded from release |
| `scripts/build.cjs`, `check.cjs` | Dependency-free assembly and meaningful release checks |
| `scripts/serve.mjs`, `validate-html.cjs`, `social-preview.cjs` | Operate on generated output/new source structure |
| `scripts/capture-phase3.cjs`, `capture-projects.cjs`, `measure-performance.cjs`, `optimize-images.py` | Repeatable local evidence/asset tools |
| `tests/phase1.spec.cjs`, `phase2.spec.cjs` | Target generated public inventory; keep legacy-preview form regression via QA route; remove redundant portfolio filter assertion in favor of current-page non-color indication |
| `tests/phase3.spec.cjs` | Seven new configuration/output/asset/project/reproducibility tests |
| `.github/workflows/checks.yml`, `playwright.config.cjs` | CI and portable browser selection |
| `.gitignore`, `.vscode/sftp.example.json` | Ignore generated output/local SFTP settings; provide sanitized example |
| `package.json`, `README.md`, `verification/PHASE3.md`, `verification/phase3/*` | Commands, editing guide, results and evidence |

**New required npm dependencies: none.** The builder uses Node built-ins. Existing Playwright, axe and HTML validation development dependencies are retained. Pillow is an optional portrait-regeneration tool, already available in this environment; the pre-generated images mean it is not required to build, test, host or run CI.

## 3. Commands and actual verification results

`npm.cmd test` completed successfully: **52 tests passed in 9.1 minutes** in the final combined run (20 Phase 1, 25 Phase 2 and seven new Phase 3 tests). Axe's 44 automated A/AA scans reported zero violations. Generated HTML, asset/link/metadata checks and Git whitespace checks also passed.

After that run, a final copy/metadata check aligned the portfolio's search/share description with its two website records, and shared the weekend/preview-path settings without changing their values. Focused metadata, reproducible-build and nested-404 checks were rerun after this cleanup.

Static checks passed with **20 valid HTML documents**, **602 internal-link occurrences**, **109 local asset references**, **two concrete enquiry forms**, no duplicate IDs, no missing required metadata, no invalid maintenance JavaScript, no active placeholder destinations and no development files in `dist/`.

The browser link crawl checked both mounts: **1,204 link occurrences, 62 anchor occurrences and 218 local resource references**. An independent GET-only check of the ordinary release preview recorded **40 public-page HTTP 200 responses** and **10 expected HTTP 404 responses** across both mounts for nested missing routes and excluded fragments/quote-preview paths. See [release preview responses](phase3/release-preview.json).

Supporting scan output: [dark-theme axe results](phase3/axe-dark.json), [light-theme axe results](phase3/axe-light.json), [dark contrast measurements](phase3/contrast-dark.json) and [light contrast measurements](phase3/contrast-light.json).

| Verification | Coverage |
| --- | --- |
| Phase 1 regressions | All original 20 tests; contact and both quote implementations use mocked success, HTTP rejection, network failure and timeout; values, duplicate protection, privacy and disabled analytics checked |
| Phase 2 regressions | All 25 tests adapted to generated public routes; 320, 375, 768, 960, 1024 and 1440px in both themes; 240 public page/width/theme combinations |
| Keyboard and enhancement | Menu labels/Tab/Escape/selection/focus return, skip links, corrected-field state, quote review, blocked storage/script/observer, no-JavaScript alternatives, reduced motion and live preference changes |
| Enlarged text | 200% text resizing at all requested widths and zoom-equivalent 720 CSS px/DPR 2 reflow; no horizontal overflow detected |
| Accessibility | Axe A/AA scans across 20 public pages plus final quote and privacy states in each theme: 44 scans; contrast checks and visible focus retained |
| New regressions | Shared navigation/contact/packages, exact project anchors, bounded robot, valid WebP images, local font loading, no generic profile links, root/subpath image loading, release exclusions, disabled analytics and byte-for-byte reproducible rebuild |
| Static host behavior | Both mounts and nested missing routes serve expected status/styles/recovery locally; ordinary preview excludes development routes |
| Side effects | No test message/order/application/subscription sent to production accounts; no push, merge or deployment |

The first combined run passed the 45 previous-phase tests and six new tests; its final reproducibility assertion correctly failed because a source content edit had been made while the run was in progress. Sources were rebuilt and left unchanged for the final combined run. A lazy-image check was also corrected to wait for actual decoding/loading rather than reading its state immediately after scrolling.

### Performance observations

These are **local Chrome lab observations**, not Lighthouse scores or production field data. The timing experiment used fresh browser contexts, no CPU/network throttling, reduced motion, three runs per width and a 750ms observation after fonts were ready. Other QA activity was running on the same machine. The layout-shift figure is the sum over this observation window, not a full user-session field metric.

| Homepage width | Median load event | Median observed LCP | Observed layout-shift range |
| --- | ---: | ---: | ---: |
| 375px | 372.7ms | 576ms | 0 |
| 1440px | 459.2ms | 624ms | 0–0.00165 |

Each initial view requested five local resources with **121,389 decoded resource bytes** in that measurement. This excludes the HTML document and below-fold lazy images. Both local font families reported loaded. Raw conditions/results: [performance.json](phase3/performance.json).

Before/after full-page capture measurements used reduced motion, normal 100% text, both themes at 375/1440px, and scrolled through lazy content. External font/map requests were intercepted in the **before** capture; the **after** capture loads the new local fonts. Therefore overall timings/font metrics are not a controlled before/after performance benchmark. Image-file bytes are directly comparable:

- Homepage/team images including the favicon: **1,374,779 → 31,500 bytes**.
- Homepage dark-theme document height: **9,852 → 7,034px** at 375px; **5,259 → 4,160px** at 1440px.
- Desktop team height: **2,370 → 2,037px**.
- Portfolio is longer on desktop because it now includes a real capture and scope/deliverable information instead of six placeholder cards; no speed claim is made from its height.

Raw capture measurements: [before](phase3/before/measurements.json), [after](phase3/after/measurements.json).

### Reproduce locally (PowerShell)

```powershell
Set-Location 'C:\Users\SALMAN\Downloads\rumiware.com\RumiWare'
npm.cmd ci --cache .npm-cache
npm.cmd run build
npm.cmd run check
$env:RUMIWARE_SCREENSHOTS_DIR = 'verification/phase3/phase1-regression'
$env:RUMIWARE_PHASE2_SCREENSHOTS_DIR = 'verification/phase3/phase2-regression'
npm.cmd test
git diff --check
```

Preview in another terminal:

```powershell
npm.cmd run preview
```

Open `http://127.0.0.1:4174/` or `/rumiware.com/`. The test runner uses a separate QA server on 4173. `npm.cmd test` builds automatically. Preview builds on startup; after editing, run the build command and refresh.

For screenshots/measurements while preview runs:

```powershell
node scripts/capture-phase3.cjs after
node scripts/measure-performance.cjs
```

The performance script and capture helpers currently default to installed Windows Chrome; browser tests have a Linux/macOS Playwright fallback for CI. Set `CHROME_PATH` when using a different Chromium executable. Do not regenerate the historical “before” capture against the new implementation.

## 4. Before/after screenshots

[Screenshot comparison index](phase3/screenshots.md): **40 captures**, covering homepage, portfolio, web-development service page, pricing and team; desktop/mobile; both themes. Earlier-phase regression captures are stored separately under `phase3/phase1-regression/` and `phase3/phase2-regression/`. Earlier phase reports/reference implementation remain available.

Representative images were visually inspected for hero balance, project evidence, typography, portrait quality, pricing layout and responsive wrapping. The contact-map embed is intercepted in regression screenshots; its blank area is a test condition, not a substituted map.

## 5. Owner-supplied facts, assets and configuration

- Supply an approved Rumi Dental Care screenshot. Confirm detailed project attribution/individual contributions and any measured outcomes before expanding the current conservative records.
- Confirm that the Mani Bakes deployed demo is reachable before adding a live-demo button. The current repository link is verified and the source preview is labelled accurately.
- Supply missing personal social-profile URLs. Generic social homepages remain hidden; the existing verified organization/profile URLs remain.
- Confirm sales-form recipient/domain/spam settings and actual notification delivery in Formspree. Local mocked acceptance does not establish email delivery.
- A newsletter needs a genuine list/provider, signup destination, sender verification, opt-in/confirmation and unsubscribe behavior before controls can return. Enquiry endpoints must remain separate.
- Confirm support boundaries, payment milestones and any analytics work in the written commercial quote. No new commercial guarantees were introduced. Optional analytics for this website remain disabled.

Missing owner input did not block unrelated implementation or verification.

## 6. Limitations and later release-review checklist

Testing used local Chrome. No manual screen-reader speech test, Safari/Firefox check, real-phone check or production deployment was performed. Zoom reflow was emulated and text resizing exercised; Chrome's browser-chrome zoom UI was not manually operated. Automated accessibility scans support review but do not establish complete conformance.

The CI workflow is written and its local commands have been exercised, but the remote Actions job has not run because nothing was pushed. A static preview cannot establish future production missing-route behavior or provider delivery. The two project-capture limitations are documented above. No production performance score is claimed.

For a later release review:

- [x] Build complete static HTML; preserve the public content URLs.
- [x] Check HTML, links/assets, IDs, metadata and release exclusions.
- [x] Retain accessible themes, enhancement fallbacks, privacy and form safeguards.
- [x] Keep original pages/photos and project evidence outside release output.
- [x] Keep local SFTP settings ignored; publish only `dist/` contents after approval.
- [ ] Owner approves project attribution, missing evidence and commercial scope.
- [ ] Owner verifies real Formspree delivery and allowed domains.
- [ ] Review on target browsers/devices and with assistive technology as needed.
- [ ] Review the remote CI result after a separately authorized push.
- [ ] After an authorized release, verify live root/subpath assets and nested HTTP 404 recovery.

No broader design phase or deployment was started.
