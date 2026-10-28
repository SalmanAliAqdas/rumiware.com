# Portfolio update

Implemented locally on `phase-1-production-readiness`, preserving the uncommitted Phase 1-3 work. No commit, push, merge, deployment or account change was made. Applicable instruction locations were checked (no AGENTS.md found); the three phase reports, shared builder/data, implementation and regression tests were inspected.

## Changes and decisions

The portfolio now uses the nine owner-supplied records in `src/data/projects.json`. Each entry has its exact supplied URL, purpose, category, Completed development status, preview, and accessible external link. Completed is explicitly identified as owner-provided development status, with no security, certification, customer or availability claim. Demo/learning labels remain separate. No project contributor list, invented repository, client count or business result was added.

The homepage features SchoolOS, PDF Toolkit and Expense Tracker as requested. Both pages render names, descriptions, status, previews and links from the same records. Homepage links target the exact portfolio anchors. The homepage/service wording and portfolio search/share metadata now match the application collection.

Five category filters are generated from the published data: Business Applications (2), Websites (1), Data Applications (3), Productivity (2), Games (1), plus All projects (9). Native buttons support Tab, Enter and Space, retain focus, show pressed state and underlining, and update a live result count. Hidden cards leave the keyboard order. A hash change to a filtered-out project restores All projects so its direct link is usable. Controls appear only after initialization; without or with a blocked script, all nine cards and external links remain visible.

The collection retains the existing navy/teal/gold palette, both themes, shared cards, responsive grids and focus styles. One enlarged-text check found long words overflowing at 320px; bounded wrapping fixes that case without clipping content. Homepage card actions align at the bottom. No framework, runtime service or dependency was added.

### Old records remain recoverable

Mani Bakes and Rumi Dental Care are absent from the generated portfolio, homepage cards, metadata and project anchors. Their prior JSON is saved unchanged in `reference/portfolio-before-nine-projects.json`. Existing Mani source/captures, its WebP and the Phase 2/3 references remain on disk; the builder does not publish the unused asset or reference files. The contact page's accurate location explanation and map title referring to Rumi Dental Care remain.

### Preview evidence

Three authentic, unedited public-screen screenshots were captured at 1440 x 1000: SchoolOS sign-in, the enquiry demo's explicitly fictional examples, and the browser-game start screen. These were visually reviewed: no student records, personal expenses, uploaded documents, credentials or live enquiries appear. Captions state the observed screen and inspection limits. Originals are retained in `reference/project-captures/portfolio-update/`; published copies are in `images/projects/`.

The other six projects use native SVG branded covers, explicitly labelled both in the artwork and captions as covers rather than application screenshots. They contain titles, categories and abstract brand shapes, with no fabricated interface or data. All previews have intrinsic dimensions, meaningful alternatives and lazy loading. Apps are linked, not embedded.

## Read-only inspection of supplied URLs

The web reader could not access these URLs. A sandboxed browser was initially denied network access; an approved network-enabled Chrome run then reached all nine with HTTP 200. HTTP success establishes neither app functionality nor uptime. Non-GET/HEAD requests were blocked. No account, form submission, document upload, record change, generated enquiry, financial action or game interaction was performed. Sleeping apps were not manually awakened.

Full observed URLs, redirects, titles and public text: [external-inspection.json](portfolio-update/external-inspection.json).

| Supplied project | Actual observation | Published wording / limitation |
| --- | --- | --- |
| [Rumiware SchoolOS](https://rumiware-schoolos.vercel.app/) | Redirected to its public school-account sign-in screen, with a fictional visitor-demo option | Owner-supplied administration purpose retained; no attendance, fees, student, staff or reporting modules claimed. Screenshot shows sign-in only. |
| [Rumi Portfolio Demo](https://rumi-portfolio-demo.vercel.app/) | Redirected to `/explore`, titled Rumi Enquiry Assistant; fictional examples describe classification, clarification and a draft for human review | Adjusted purpose to the observed enquiry-workflow demonstration. Retained supplied name/category and Portfolio demo label. No processing or AI generation was exercised. |
| [Rumiware Stock Market App](https://rumiware-stock-market.streamlit.app/) | Sleeping-app notice | Generic owner-supplied market-information purpose only. Features remain unverified; no prices, forecasting, trading, advice or return claims. |
| [Rumiware PDF Toolkit](https://rumiware-pdf-toolkit.streamlit.app/) | HTTP 200 app shell, blank body after the five-second observation | Generic PDF-task purpose only. Operations, processing location, deletion and privacy remain unverified. |
| [Python 2D Platformer](https://salmanaliaqdas.github.io/python-2d-game-super-mario/) | Coin Runner browser-game start screen with Start game and keyboard instructions | Play demo links to the browser edition. Gameplay was not exercised. Neutral supplied title and Learning/game demo label; no Nintendo affiliation claim. |
| [Rumiware Weather App](https://rumiware-weather-app.streamlit.app/) | Sleeping-app notice | Generic location-weather purpose only; current conditions and forecasts unverified. |
| [Rumiware Expense Tracker](https://rumiware-expense-tracker.streamlit.app/) | HTTP 200 app shell, blank body after the five-second observation | Generic expense-organizing purpose only; storage, accounts, exports, budgets and charts unverified. |
| [Rumiware QR Code Studio](https://rumiware-qr-code-studio.streamlit.app/) | Sleeping-app notice | Generic QR-code purpose only; content types, customization and downloads unverified. |
| [Rumiware Movies](https://rumiware-movies.streamlit.app/) | Sleeping-app notice | Generic movie-information purpose only; no AI, personalization, streaming, ratings or filter claims. |

The six unavailable interfaces are not marked incomplete. Their supplied links and owner-provided Completed status remain. Availability is a separate observation.

## Files affected

- `src/data/projects.json`: nine shared records, categories, featured flags, preview metadata and links.
- `src/data/pages.json`: portfolio title/description; `src/data/services.json`: project-collection wording.
- `src/pages/index.html`, `portfolio.html`: three featured cards, status explanation and collection/filter layout.
- `scripts/build.cjs`: shared card/preview/filter rendering; data-provided image dimensions; safe external links.
- `src/assets/script.js`, `style.css`: progressively enhanced filtering/count/direct anchors and scoped responsive card rules.
- `images/projects/{schoolos,portfolio-demo,python-2d-platformer}.png`, six project-cover SVGs.
- `reference/portfolio-before-nine-projects.json`, `reference/project-captures/portfolio-update/`: recoverable records/original captures.
- `tests/phase3.spec.cjs`: old two-project assertions updated; `tests/portfolio.spec.cjs`: six meaningful portfolio regressions.
- `scripts/inspect-portfolio.cjs`, `capture-portfolio-public.cjs`, `capture-portfolio.cjs`: read-only inspection and repeatable screenshot tools.
- `README.md`, this report and `verification/portfolio-update/*`: editing guidance and evidence.

## Verification

**Complete regression run: 58 tests passed in 10.6 minutes** (20 Phase 1, 25 Phase 2, seven Phase 3, six new portfolio tests). See [regression.log](portfolio-update/regression.log).

| Check | Actual result |
| --- | --- |
| Static build / HTML | 20 complete documents; HTML validator returned zero issues; no new dependency |
| Static links/assets | 601 internal-link occurrences, 120 local asset references, two active sales forms; zero errors |
| Both hosting mounts | Browser crawl checked 1,202 links, 60 anchors, 240 resources and four form occurrences across root and repository mounts; no page JavaScript errors |
| Supplied project URLs | All nine match the independently listed inspection URLs and appear exactly in generated links; retired entries and unused preview excluded; contact reference retained. [Output audit](portfolio-update/output-audit.json) |
| Responsive / themes | All 20 pages at 320, 375, 768, 960, 1024 and 1440px, dark and light; no horizontal overflow or header overlap; independent breadcrumbs |
| Portfolio interaction | Keyboard Space selection, retained focus/rings, pressed-state underlining, exact category membership/counts in both themes; shared featured anchors; filtered-out anchor recovery |
| Progressive enhancement | All nine entries readable with JavaScript disabled or shared script blocked; inactive filters hidden; existing no-JavaScript navigation/quote alternatives retained |
| Enlarged text / motion | Portfolio 200% text at all six widths; broader existing zoom-equivalent/text tests in both themes; reduced-motion checks passed |
| Accessibility | 44 automated A/AA scans across 20 pages, final quote and privacy states in each theme: zero violations. [Dark](portfolio-update/axe-dark.json), [light](portfolio-update/axe-light.json) |
| Contrast | Both-theme text, emphasis, errors, hover, focus and control checks passed. [Dark](portfolio-update/contrast-dark.json), [light](portfolio-update/contrast-light.json) |
| Forms and privacy | Mocked success, rejection, network failure, timeout, duplicate guard, complete-brief validation, retained values, accessible feedback and privacy behavior passed; no analytics requests |
| Images / build | All public project images loaded at both mounts; dimensions and alternatives present; reproducible rebuild passed; release excludes references and development files |
| Review artifacts | 12 final portfolio/homepage captures; representative desktop/mobile and both-theme images visually reviewed; originals of public project captures reviewed for private data |
| Git whitespace | `git diff --check` passed |

Commands used (PowerShell):

```powershell
npm.cmd run build
npm.cmd run check
$env:RUMIWARE_SCREENSHOTS_DIR = 'verification/portfolio-update/phase1-regression'
$env:RUMIWARE_PHASE2_SCREENSHOTS_DIR = 'verification/portfolio-update/phase2-regression'
npm.cmd test
node scripts/capture-portfolio.cjs
git diff --check
```

The capture helper uses the ordinary local preview on port 4174; tests use their separate QA server on 4173. The existing verification skill was used to trace shared data through generation and browser interaction. No API, database, hosting configuration or environment secret was needed.

The earlier focused run passed 12 checks and failed the new 320px enlarged-text assertion. After the wrapping fix, all six portfolio checks passed. Sources were rebuilt and kept stable for the complete run.

Production form requests are mocked or blocked. Mocked acceptance does not prove recipient configuration or email delivery. Analytics remains disabled, privacy settings and legacy-cookie retirement remain intact, newsletter controls remain absent, and the original sales endpoints are retained. External app links are checked against supplied values locally; regression tests do not submit to those apps.

## Screenshots

Twelve final captures cover both themes at 375px and 1440px: full homepage, homepage project section and full portfolio. Screenshots show local generated output, not a deployment.

| View | Dark | Light |
| --- | --- | --- |
| Desktop homepage projects | [1440px](portfolio-update/screenshots/homepage-projects-1440-dark.png) | [1440px](portfolio-update/screenshots/homepage-projects-1440-light.png) |
| Mobile homepage projects | [375px](portfolio-update/screenshots/homepage-projects-375-dark.png) | [375px](portfolio-update/screenshots/homepage-projects-375-light.png) |
| Desktop portfolio | [1440px](portfolio-update/screenshots/portfolio-1440-dark.png) | [1440px](portfolio-update/screenshots/portfolio-1440-light.png) |
| Mobile portfolio | [375px](portfolio-update/screenshots/portfolio-375-dark.png) | [375px](portfolio-update/screenshots/portfolio-375-light.png) |
| Full desktop homepage | [1440px](portfolio-update/screenshots/index-1440-dark.png) | [1440px](portfolio-update/screenshots/index-1440-light.png) |
| Full mobile homepage | [375px](portfolio-update/screenshots/index-375-dark.png) | [375px](portfolio-update/screenshots/index-375-light.png) |

Earlier-phase regression screenshots from this run are kept separately in `portfolio-update/phase1-regression/` and `portfolio-update/phase2-regression/`.

## Remaining confirmation and limits

- Confirm whether the supplied Portfolio Demo URL/name/category should continue to identify the enquiry assistant. The visible purpose is described accurately now; no different URL was invented.
- Confirm the generic owner-supplied purposes for the six sleeping/blank apps and supply safe screenshots or verified feature inventories before expanding descriptions.
- Confirm SchoolOS modules through a safe fictional visitor view before naming them. Its actual school workspace was not inspected.
- The supplied Python title is retained, while the public URL currently presents Coin Runner Browser Edition. No implementation-language claim beyond the supplied project name was added.
- Owner-provided Completed status is retained for all nine; this task did not independently audit completion, security or production readiness.
- Local Chrome automation, screenshots and axe scans do not establish full accessibility conformance, real-device behavior or production performance. No manual screen-reader, Safari/Firefox or deployed-host check was performed. Existing provider-delivery limitations from Phase 1 remain.

The verification flow follows the local verification skill: shared JSON -> static builder -> complete page -> filter/link action -> visible result. This portfolio has no API, database or environment-secret boundary. Broader design and deployment were not started.
