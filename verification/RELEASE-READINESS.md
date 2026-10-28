# Release readiness

Local review dated **29 October 2026 (Asia/Karachi)** on `phase-1-production-readiness`, starting from `31e50cc92dc022cc46542e3ab8da95b3145f1f0d`. No AGENTS.md was found in the repository or checked ancestors. Read the Phase 1-3, portfolio-update and portfolio-screenshot reports. The owner has approved the visual result.

## Decision and release scope

The local production artifact is ready for a separately authorized static upload to the existing production host, subject to the owner checks below. No local application defect remains in the checked scope. **This is not permission to push, merge or deploy. The existing GitHub Pages publishing path needs a separate adaptation before this source migration reaches its publishing branch.**

The release saves the completed static HTML/CSS/vanilla JavaScript site, shared Node-only builder/data/templates, optimized public assets, regression tests and documentation. No framework, database or paid service was introduced. Existing URLs, themes, forms, privacy controls and authentic previews remain.

One small release fix was necessary: the formerly named Rumi Portfolio Demo entry is now **Rumi Enquiry Assistant**, categorized as Business Applications / Enquiry Workflows, labelled Fictional-data demo and described as an enquiry-workflow demonstration. Its supplied URL and stable `portfolio-demo` anchor remain. This matches the previously inspected public interface and authentic screenshot. The now-empty Websites filter disappears automatically; the four remaining category groups plus All projects are generated from data. Regression assertions cover this correction.

No unrelated application refactor, design change or new screenshot capture was performed. Existing approved screenshots were reused; the old website captures predate this minor title/category correction, while fresh browser checks cover the corrected entry.

## Build and exact output

From the repository root `C:/Users/SALMAN/Downloads/rumiware.com/RumiWare`:

```powershell
npm.cmd ci --cache .npm-cache  # only when dependencies need installing
npm.cmd run build
npm.cmd run check
```

Deployable output is **`C:/Users/SALMAN/Downloads/rumiware.com/RumiWare/dist/`**, meaning `<checkout>/dist/` on another machine. Publish its **contents**, not the containing folder or repository root. `dist/` remains generated and ignored by Git under the established policy.

The checked artifact contains **50 files totaling 1,572,253 bytes**, including 20 complete HTML pages. A file-by-file size and SHA-256 inventory is saved in [output-manifest.json](release/output-manifest.json). The reproducible-build regression passed against current sources. No generated HTML is staged at the old repository root: the maintained sources live under `src/`, and the pre-migration pages remain recoverable in `reference/phase2/`.

## Checks actually run

- `npm.cmd run build`: passed; 20 complete public HTML documents generated.
- `npm.cmd run check`: passed; 20 valid documents, 607 internal-link occurrences, 120 asset references and two active enquiry forms; zero issues.
- Fresh Playwright release selection: **34 passed in 4.4 minutes**, covering Phase 1 functional regressions, all seven Phase 3 checks and all eight portfolio checks. The existing multi-page screenshot batch was excluded to reuse approved captures. [Log](release/regression.log)
- Browser crawl: 1,214 links, 60 anchors, 240 local resources and four form occurrences checked across the production-root and repository-subpath layouts, with no page JavaScript errors.
- Contact, quote and QA-only legacy preview: validation, mocked success/rejection/network/timeout, duplicate guard, preserved failure values and feedback passed. No production message was submitted.
- Privacy settings and disabled analytics passed, including saved legacy acceptance, withdrawal and cookie retirement.
- Project filters, keyboard focus, all nine destinations, larger screenshot links, responsive image selection, stable anchors, JavaScript-disabled/failed-script access and enlarged portfolio text passed.
- Canonicals, sitemap, sharing PNG, favicon and nested 404 recovery at both mounts passed. No CNAME or domain redirect was introduced.
- Fresh content audit confirmed the nine URLs exactly match the supplied list, all nine preview files match the source bytes, the assistant is accurately identified, no retired portfolio/marketing entries or counters returned, and the accurate contact-location reference remains. [Audit](release/content-audit.json)
- Current layout/accessibility audit: 24 homepage/portfolio viewport/theme combinations passed at the six requested widths; two current portfolio A/AA scans reported zero violations; no page JavaScript errors. [Results](release/layout-and-axe.json)
- Prior Phase 2 evidence was reused where behavior was unchanged: all 25 checks have passing evidence, including storage/observer failures, reduced motion, 200% zoom/text reflow, contrast and 44 automated A/AA scans with zero violations. Two earlier screenshot batches passed after their documented deadline adjustment. [Previous complete evidence](PORTFOLIO-SCREENSHOTS.md)
- Existing final desktop/mobile, dark/light screenshots and six authentic original captures remain linked in [PORTFOLIO-SCREENSHOTS.md](PORTFOLIO-SCREENSHOTS.md). New captures were unnecessary for this review.
- Candidate credential-pattern scan found no matches; private local upload settings, dependencies, caches, generated output and repeated capture PNGs are excluded from the commit. [Candidate audit](release/candidate-audit.json)
- `git diff --check` and `git diff --cached --check`: passed. The staged tree was scanned directly for credential patterns and credential-bearing URLs; no findings, symlinks, private config, generated output or repeated captures were found. [Staged review and file list](release/staged-review.json)

The fresh browser command was:

```powershell
npx.cmd playwright test tests/phase1.spec.cjs tests/phase3.spec.cjs tests/portfolio.spec.cjs --grep-invert 'desktop/mobile and both themes: changed pages'
```

No test result here establishes Formspree inbox delivery, third-party backend correctness, production uptime or a security certification. Browser checks used installed Chrome locally; manual screen-reader, Safari/Firefox and real-device coverage remain outside this review.

## Hosting evidence and what publishes

The two hosting paths must be handled separately. [Sanitized evidence](release/hosting-evidence.json)

### Production: rumiware.com

The existing ignored local upload configuration specifies **SFTP**, a domain-specific `domains/rumiware.com/public_html` document root and **uploadOnSave: false**. Account prefix, hostname and login values are intentionally excluded from this report and commit. This is evidence of the intended manual production upload workflow; no authenticated production-host session was opened to verify its current control-panel configuration.

The production publish action is an explicitly approved upload of built `dist/` contents to the confirmed domain document root. A local commit does not upload anything. The checked-in GitHub workflow has no SFTP or production-deployment step.

### GitHub Pages preview

The repository is public with Pages enabled and default branch `main`. Public records show a successful **pages build and deployment** from `main`, environment `github-pages`, at the original commit `31e50cc...`: [observed run](https://github.com/SalmanAliAqdas/rumiware.com/actions/runs/40718121683). Its workflow path is GitHub's dynamic Pages workflow. The direct Pages-settings API returned 404 without authenticated settings access, so the precise source folder was not independently verified.

**Treat a push or merge to `main` as a potential automatic Pages publication.** The new checked-in `checks.yml` is verification-only and does not disable that existing external Pages configuration. A push of this review branch triggers the checked-in checks; the observed Pages publisher uses `main`, but do not assume remote settings or integrations are immutable.

The new site requires the Node build. A branch-root Pages publisher cannot be assumed to run it or publish the ignored `dist/`. Publishing the raw source tree would both miss the root HTML and risk exposing archives/development files. Before a later authorized main-branch publication, the owner must choose and review one of:

1. A custom Pages workflow that installs dependencies, builds, checks and publishes **only `dist/`**, with an explicit deployment gate; or
2. A dedicated output branch whose root contains only approved built files, configured as the Pages source.

Neither workflow/settings change nor publication was performed. This is a **Pages publication prerequisite**, not a failure of the production SFTP artifact. The preview mount remains `/rumiware.com/`; production canonicals remain `https://rumiware.com/`.

GitHub documents branch publishing and custom build workflows in its [publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [custom-workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Proposed production procedure ? not executed

1. Owner confirms the SFTP destination really serves rumiware.com and reviews credentials and domain-root/404 settings. Keep automatic upload disabled.
2. Download a dated backup of the currently deployed website and its host-specific routing/404 configuration to a private location outside this repository. Record the current live revision and preserve unrelated host files/uploads.
3. Build and check the approved source revision. Retain the approved built artifact and compare its files with `release/output-manifest.json` for this release.
4. Upload only the contents of `dist/`, including `.nojekyll`, HTML, CSS/JS, images/fonts/licenses, robots.txt, sitemap.xml and 404.html. Prefer a provider-supported staged/atomic switch; otherwise use the owner's established controlled SFTP replacement process after backup.
5. Never upload `src/`, `reference/`, `.git/`, `.github/`, `.vscode/`, dependencies, test output, verification evidence, original captures or account configuration. Audit the existing web root separately: uploading an allowlist does not remove old deployed development files. Remove only specifically identified obsolete website artifacts after backup; do not mirror-delete the entire document root or overwrite unrelated host configuration.
6. Confirm the host serves 404.html with an actual HTTP 404 for missing routes, using the provider's existing supported error-document mechanism. No generic Apache/nginx configuration was guessed or added locally.
7. After authorized publication, smoke-check public pages, assets, both themes, menu/filter/preview links, privacy settings, sitemap/canonicals and nested missing routes. Do not submit a production enquiry as part of this automated smoke check.
8. Handle GitHub Pages separately using the reviewed publishing source described above. Do not copy production account settings or change DNS/CNAME as part of preview publication.

### Rollback ? not executed

For production SFTP, restore the dated pre-publication backup and its matching routing/404 settings through the same controlled upload process. Use the release file manifest to remove only files newly introduced by that failed deployment where needed; preserve unrelated server files. Verify restored pages and real missing-route status. Keep the previous built artifact so rollback does not depend on rebuilding an unknown historical environment.

For a future Pages workflow, retain the prior successful built artifact and republish it through the approved Pages publishing route. With a dedicated output branch, restore the previous static artifact through a new reviewed commit. Do not force-push, rewrite history or assume the pre-build original source commit can be rebuilt using the new builder. No rollback operation was performed in this task.

## Owner configuration and remaining limitations

- Confirm production host access, document root, backup and native 404 behavior before the actual upload. The local config establishes intent, not authenticated host health.
- Resolve the Pages publishing-source/build procedure before pushing or merging this source migration to its publisher. The exact remote Pages source folder was not available through the settings API.
- Contact action `mvkzkdbv` and quote action `mkjojozj` are preserved. Owner must confirm recipient addresses, allowed domains, spam handling and inbox delivery with Formspree; mocked acceptance proves only UI behavior.
- Newsletter signup remains honestly unavailable. A real list/provider and approved signup/confirmation/unsubscribe integration are needed before enabling it. Optional analytics remain disabled.
- Stock-history rendering remains unverified; the authentic preview shows populated quote cards and the description avoids promising chart behavior or real-time prices. PDF processing, downloads, private school administration, enquiry generation and other external backend operations were not audited. Expense captures use explicitly fictional demo data.
- The historically tracked SFTP configuration is removed from the new tree and retained only as an ignored local file. Old Git history is unchanged as instructed. The owner should review that old tracked configuration and rotate any credentials it contained; deleting a tracked file does not erase its parent commit. No private values are reproduced here.
- The earlier historical reports describe their then-current project names/categories. This report and current shared data supersede the enquiry-assistant naming limitation.

## Local Git save and proposed file scope

This report belongs to the local release-preparation commit titled **Prepare Rumiware static site for release** on `phase-1-production-readiness`. Identify its exact hash with `git log -1 --oneline` after saving; the completion response records that hash. The commit is a local source snapshot, not a production publication. The proposed file list and secret/size review are retained in [candidate-audit.json](release/candidate-audit.json).

The staged review also identified whitespace in untouched upstream OFL license text and archived Mani source. Scoped [Git whitespace attributes](https://git-scm.com/docs/gitattributes#_checking_whitespace_errors) preserve that material verbatim while keeping application whitespace checks enabled. The downloaded dental-site HTML stays local and ignored as redundant third-party research; it was removed from staging without deleting the local file.

The proposed update includes the maintained source, selected public assets, exact pre-Phase-3 reference source, authentic original project captures, tests, build/configuration, licensed fonts, reports, structured evidence/logs and the twelve final website screenshots. The three files over 1 MB are justified evidence: the original Movies capture and two full desktop portfolio screenshots. Repeated intermediate/regression PNGs (roughly 74 MB) remain on disk, ignored. Their historical report links refer to local evidence; they are not deployment files.

No unrelated changed files were identified. The already staged removal of `.vscode/sftp.json` belongs to the website privacy cleanup and is retained. The ignored local file is not deleted. Generated `dist/` follows the established ignored-output policy. No empty commit, amend, history rewrite, push, merge, deployment or external-setting update is authorized by this review.
