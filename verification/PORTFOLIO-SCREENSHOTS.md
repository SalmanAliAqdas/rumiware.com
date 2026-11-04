# Portfolio screenshots

Completed locally on `phase-1-production-readiness`, preserving the uncommitted Phase 1-3 and portfolio work. No applicable AGENTS.md was found in the repository or checked ancestors. Read `verification/PORTFOLIO-UPDATE.md`, the project data, shared renderer, styles and affected tests before editing. No commit, push, merge or deployment was performed.

## Captured apps and chosen screens

All six supplied apps were successfully inspected and captured. None remained unavailable, and none uses a generic cover in the generated website now.

The initial outer-page inspection returned empty body text. These public pages contain the actual app in a Streamlit frame; inspecting the public frame resolved the apparent blank state. No wake-up action was needed in the successful capture sessions. One stock-page navigation timed out during refinement; a later attempt successfully captured the populated overview. HTTP 200 alone was not treated as proof of a ready screen.

| App | Genuine screen used | Safe data and limits |
| --- | --- | --- |
| Stock Market | Market Atlas overview with navigation, AAPL search field and populated quote cards | Existing public market information only. The app warns quotes may be delayed. The preview concentrates on quotes; historical-chart rendering was not established, so the description does not promise a working chart, real-time data, advice or returns. The app itself ellipsizes some metric text at this viewport; it was not redrawn. |
| PDF Toolkit | Dashboard with workspace navigation, merge/split/compression/text tools and tool categories | No file was uploaded and no document operation was executed. The description names offered tools, not independently tested conversion results or privacy guarantees. |
| Weather | Default Lahore conditions, hourly outlook and five-day forecast overview | Existing public city data. No extra city searches were necessary. Forecast accuracy and freshness were not independently verified. |
| Expense Tracker | Dashboard with income/expense/balance summaries, monthly spending and category charts | The app explicitly labels its existing data as a fictional demo workspace. No transaction, setting or stored record was changed. |
| QR Code Studio | Website URL generator and its actual QR preview, with PNG/SVG controls | Entered only `https://rumiware.com/` and pressed Enter. No upload, account, email address or credential was used. Download controls were observed; files were not downloaded from the app. |
| Movies | CineMatch discovery catalogue with expanded navigation, search, sorting and displayed movie cards/ratings | Existing public catalogue only. No repeated searches, recommendation generation or account action. Movie data and ratings were not independently verified. |

Original screen URLs, titles, timestamps, viewport dimensions and public interface text are recorded in [captures.json](portfolio-screenshots/captures.json); the feature/control inspection is in [inspection.json](portfolio-screenshots/inspection.json).

Movies was captured through Streamlit's native `embed=true` and `embed_options=dark_theme` display options so the framework toolbar did not cover its identifying content and the app's dark controls were legible. This is the app's own rendering, not injected CSS or a fabricated interface. The options are documented by [Streamlit](https://docs.streamlit.io/deploy/streamlit-community-cloud/share-your-app/embed-your-app). The website still links to the original supplied public URLs and embeds no app frames.

All six final PNGs were visually inspected. No sleeping notice, visible spinner, skeleton, error page or blank screen was accepted as a finished preview. Stock uses a populated quote overview rather than the unverified chart area. No personal records, private documents, student data, credentials or account details appear. Expense values are visibly identified as fictional demo data. No interface, chart, value or result was invented or altered.

## Descriptions corrected after inspection

The provisional generic descriptions now identify only visible capabilities:

- Stock Market: symbol search, available quotes and company context; no real-time or financial-performance claim.
- PDF Toolkit: offered merge, split, compression and text-extraction tools; no upload-processing, deletion or privacy guarantee.
- Weather: current conditions, hourly outlook and five-day forecast.
- Expense Tracker: income/spending/balance summaries and monthly/category charts; no persistence or account claim.
- QR Code Studio: website QR preview, customization and PNG/SVG download controls; no unsupported content-type list or storage/privacy claim.
- Movies: title search, sorting, displayed ratings and detail links; no AI, personalized recommendations or streaming claim.

Names, exact app links, categories, owner-provided **Completed** status and the three homepage selections remain. Captions explain the photographed screen. No contributor or team attribution was added. SchoolOS, Portfolio Demo and the platformer records are unchanged. Mani Bakes and Rumi Dental Care remain absent from project listings; the unrelated contact-location reference remains.

## Integration and image sizes

The shared JSON now selects real WebP previews for all six apps, automatically updating the PDF Toolkit and Expense Tracker homepage cards. Existing SVG covers and prior project data remain recoverable; they are not copied into `dist/`.

The original captures already have a 16:10 viewport: Stock Market at 1280 x 800, the other five at 1440 x 900. The optimizer resizes proportionally without stretching, compositing or changing content. Published variants are 640 x 400 and 1280 x 800 WebP, quality 86. The shared frame uses `object-fit: contain`; screenshot edges, navigation and identifying headings remain visible. Longer app content naturally continues below the captured viewport.

Portfolio screenshots are ordinary accessible links to the larger 1280px image. They work by keyboard and without JavaScript, include a new-tab announcement and keep visible focus. There is no custom gallery or modal. Project titles remain real HTML headings. Homepage cards retain their existing portfolio-anchor links. Intrinsic dimensions reserve space; `srcset`/`sizes` selects an appropriate variant, with lazy loading and asynchronous decoding.

| Preview | 640px bytes | 1280px bytes | Original outside public output |
| --- | ---: | ---: | --- |
| stock-market | 20,030 | 56,658 | [PNG](../reference/project-captures/streamlit/stock-market.png) |
| pdf-toolkit | 15,366 | 44,858 | [PNG](../reference/project-captures/streamlit/pdf-toolkit.png) |
| weather | 13,772 | 36,846 | [PNG](../reference/project-captures/streamlit/weather.png) |
| expense-tracker | 13,608 | 40,280 | [PNG](../reference/project-captures/streamlit/expense-tracker.png) |
| qr-code-studio | 10,660 | 24,638 | [PNG](../reference/project-captures/streamlit/qr-code-studio.png) |
| movies | 43,502 | 127,754 | [PNG](../reference/project-captures/streamlit/movies.png) |

The original PNGs total **1,962,715 bytes**. Six large WebPs total **331,034 bytes**, and the six small variants total **116,938 bytes**. The two updated homepage thumbnails together are **28,974 bytes** at the tested normal-density mobile/desktop widths. Real screenshots cost more than the previous small SVG covers; responsive variants and deferred loading limit that added cost. No new homepage performance score is claimed. Exact dimensions and sizes: [assets.json](portfolio-screenshots/assets.json).

## Files changed

- `src/data/projects.json`: six previews, responsive filenames, alternatives, captions and verified descriptions.
- `scripts/build.cjs`: responsive preview markup, accessible larger-image links only for these screenshots, and explicit copying of both image sizes.
- `src/assets/style.css`: two scoped framing/hint rules for preview links; palette, themes and layout system retained.
- `images/projects/{stock-market,pdf-toolkit,weather,expense-tracker,qr-code-studio,movies}{,-640}.webp`: twelve optimized assets.
- `reference/project-captures/streamlit/*.png`: six authentic original captures, excluded from release.
- `reference/projects-before-streamlit-screenshots.json`: recoverable pre-update project data; existing SVG covers retained.
- `scripts/inspect-streamlit.cjs`, `capture-streamlit.cjs`, `optimize-project-previews.py`: inspection/capture/encoding helpers; Pillow is optional for regeneration, not build/hosting.
- `scripts/capture-portfolio.cjs`: optional output-directory setting so this task's website screenshots do not overwrite prior evidence.
- `tests/phase1.spec.cjs`, `phase2.spec.cjs`: give only the two multi-page screenshot batches a 120-second deadline; keep their assertions unchanged.
- `tests/portfolio.spec.cjs`: accommodate the additional image links; test responsive image selection, rendered proportions and keyboard-operated larger previews at both mounts.
- `README.md`, this report and `verification/portfolio-screenshots/*`: current editing instructions and evidence.

No npm dependency was added. Public content URLs, original project links, runtime JavaScript, form pages, shared head and provider configuration were preserved. A before/after hash/data audit confirmed all three unrelated project records and five critical files unchanged: [preservation.json](portfolio-screenshots/preservation.json).

## Checks and actual results

All **60 regression checks have passing evidence across the complete run and a focused rerun**: 20 Phase 1, 25 Phase 2, seven Phase 3 and eight portfolio checks.

The complete run recorded **58 passes and two screenshot-batch timeouts in 14.9 minutes**. Both batches exceeded their former 45-second deadline. The focused rerun used a 120-second deadline and **both passed in 2.5 minutes** (about one minute per batch). Those two tests now explicitly use 120 seconds; their assertions are unchanged. This is not presented as a single clean 60-test run. Evidence: [complete run](portfolio-screenshots/regression.log), [successful two-test rerun](portfolio-screenshots/screenshot-rerun.log).

| Check | Actual result |
| --- | --- |
| HTML, script and release checks | `npm.cmd run check` passed again on resume: 20 valid documents, 607 internal-link occurrences, 120 asset references, two active enquiry forms, zero errors |
| Root and repository mount | Existing browser crawl passed: 1,214 link occurrences, 60 anchors, 240 resource references and four form occurrences across both mounts; no page JavaScript errors |
| Six screenshot previews | Existing tests opened all six larger images by keyboard at both mounts; responsive images loaded, alternatives and 16:10 frames checked |
| Actual asset audit on resume | All 12 current WebPs match their published bytes, manifest dimensions and sizes; all six original PNG dimensions match; both homepage featured screenshots and all portfolio entries reference the right variants |
| Categories and links | Existing keyboard filtering, pressed-state/focus indicators, category counts, project destinations and hidden-anchor recovery tests passed in both themes |
| Responsive and themes | Existing checks passed for all 20 pages at 320, 375, 768, 960, 1024 and 1440px in dark/light themes; no horizontal overflow or header overlap |
| Enlarged text and enhancement | Existing 200% zoom-equivalent/text resizing, JavaScript-disabled/failed-script, reduced-motion, theme-storage and optional-element checks passed |
| Accessibility and contrast | All 44 saved A/AA scans were checked on resume and have zero violations. Both-theme contrast tests passed. [Dark scans](portfolio-screenshots/axe-dark.json), [light scans](portfolio-screenshots/axe-light.json), [dark contrast](portfolio-screenshots/contrast-dark.json), [light contrast](portfolio-screenshots/contrast-light.json) |
| Layout stability | Held-back image requests were released after measuring reserved geometry: unchanged after decoding in all eight desktop/mobile, theme and page combinations. [Results](portfolio-screenshots/layout-stability.json) |
| Loading cost | Existing normal-density mobile/desktop tests selected the 640px PDF/Expense thumbnails (28,974 bytes together); images retain lazy loading |
| Forms and privacy | Existing mocked success, rejection, network/timeout recovery, duplicate guards, complete-brief validation, privacy and disabled-analytics tests passed |
| Preservation | Resume audit reconfirmed all three unrelated project records and five critical files against the saved baseline; retired project entries remain absent |
| Output and reproducibility | Existing deterministic rebuild test passed; original captures, replaced covers, references and retired previews excluded from public output. [Asset audit](portfolio-screenshots/asset-audit.json) |
| Website screenshots | All 12 existing final website captures are present; representative desktop/mobile and theme views were visually rechecked on resume |
| Whitespace | `git diff --check` passed on resume |

### Resume audit, 29 October 2026 (Asia/Karachi)

The screenshot assets, shared-data integration, observed descriptions and verification work were already implemented. The remaining report placeholder was unfinished. On resume, inspected branch/status/diff, instruction locations, both portfolio reports, current project data, renderer, actual images, generated HTML and the saved test results. Reused the valid captures and optimized files. Repeated only the read-only static checks, asset/generated-output comparisons, preservation audit and representative visual review needed to establish the current state. No application code, project records, images or captures were changed during this resume; this report was finalized.

The existing browser tests were not needlessly repeated: the saved successful results correspond to the current implementation, and the current asset/data audits found no drift. No current live-app availability or backend-operation claim is inferred from these saved screenshots.

The first focused run passed seven checks and exposed an overly exact test assertion: browsers round density-adjusted `naturalWidth`/`naturalHeight` for width-descriptor srcsets. The test now allows that integer rounding while checking the actual rendered ratio and opening the full-size binary. The focused keyboard/larger-image test then passed at both mounts.

All website form requests in regression tests are mocked or blocked. No message or enquiry was sent to a production endpoint. Optional analytics remain disabled; original privacy controls and provider endpoints remain. Static previews cannot prove future production-host behavior or Formspree delivery.

## Final website screenshots

Twelve final captures show the local generated site at 375px and 1440px in both themes. Representative previews, captions, headings, image framing and layouts were visually reviewed. Original captures are linked in the asset table above.

| View | Dark | Light |
| --- | --- | --- |
| Desktop homepage projects | [1440px](portfolio-screenshots/website/homepage-projects-1440-dark.png) | [1440px](portfolio-screenshots/website/homepage-projects-1440-light.png) |
| Mobile homepage projects | [375px](portfolio-screenshots/website/homepage-projects-375-dark.png) | [375px](portfolio-screenshots/website/homepage-projects-375-light.png) |
| Desktop portfolio | [1440px](portfolio-screenshots/website/portfolio-1440-dark.png) | [1440px](portfolio-screenshots/website/portfolio-1440-light.png) |
| Mobile portfolio | [375px](portfolio-screenshots/website/portfolio-375-dark.png) | [375px](portfolio-screenshots/website/portfolio-375-light.png) |
| Full desktop homepage | [1440px](portfolio-screenshots/website/index-1440-dark.png) | [1440px](portfolio-screenshots/website/index-1440-light.png) |
| Full mobile homepage | [375px](portfolio-screenshots/website/index-375-dark.png) | [375px](portfolio-screenshots/website/index-375-light.png) |

## Reproduce locally

```powershell
npm.cmd run build
npm.cmd run check
$env:RUMIWARE_SCREENSHOTS_DIR = 'verification/portfolio-screenshots/phase1-regression'
$env:RUMIWARE_PHASE2_SCREENSHOTS_DIR = 'verification/portfolio-screenshots/phase2-regression'
npm.cmd test

# With ordinary preview running on 4174:
$env:RUMIWARE_PORTFOLIO_SCREENSHOTS_DIR = 'verification/portfolio-screenshots/website'
node scripts/capture-portfolio.cjs
```

Public capture regeneration is separate: `node scripts/capture-streamlit.cjs` (or supply one of the six IDs to refresh only that app), then visually review each new original before running `python scripts/optimize-project-previews.py`. Do not publish a new capture just because a request succeeded. Future app states or data may change; recheck privacy and fictional-demo labels each time. The capture helper does not log in, upload files, modify expense records or execute trades.

Chrome was used locally. No manual screen-reader speech, Safari/Firefox, real-phone or production deployment check was performed. Automated scans and screenshots support review but do not establish complete accessibility conformance. Live app operations involving private data or uploads were deliberately not exercised; descriptions reflect visible interfaces, not backend audits. Earlier unrelated project-verification limits remain as recorded in `PORTFOLIO-UPDATE.md`.


## Project caption cleanup ? November 5, 2026

Removed screenshot captions from all 12 Portfolio records and the separate
homepage Enquiry Assistant record. The shared preview renderer now emits only
the image and its existing larger-preview link where available. Alt text, image
dimensions, responsive sources, project descriptions, status, links, categories,
filters and homepage featured selection remain unchanged. Removed caption-only
CSS; article illustration captions are unaffected.

Visitor disclosures use the existing `presentation` field on both pages: delayed
market quotes, fictional expense data, and fixed fictional enquiry examples with
no automatic replies. A read-only visit to the public Enquiry Assistant `/explore`
page confirmed fixed fictional messages, optional explicitly enabled live
generation, and manual review. No simulation, generation, form submission or
private dashboard was exercised. No unavailable AI capability is advertised.

### Former caption text retained as historical capture evidence

These notes describe earlier captures; they are no longer customer-facing copy.

| Project | Former caption |
| --- | --- |
| Rumiware SchoolOS | Public sign-in screen; school records and administration modules were not inspected. |
| Rumi Enquiry Assistant | Public fictional-example screen; no enquiry was processed or generated. |
| Rumiware Stock Market App | Stock quote overview; the app notes that quotes may be delayed. |
| Rumiware PDF Toolkit | PDF workspace overview; no documents were uploaded. |
| Python 2D Platformer | Public browser-game start screen; gameplay was not exercised. |
| Rumiware Weather App | Lahore conditions and forecast overview. |
| Rumi Library | Public library homepage with an empty catalogue at capture; no library records were changed. |
| Rumiware Expense Tracker | Dashboard using the app's existing fictional demo data. |
| Rumiware QR Code Studio | Website QR preview generated for rumiware.com. |
| Rumiware Movies | Movie discovery overview with catalogue navigation. |
| Rumi Dental Care | Public clinic homepage; no appointment form was submitted. |
| Mani Bakes | Public bakery homepage; no order was submitted. |
| Rumi Enquiry Assistant (homepage) | Public Explore screen with fictional enquiries; no replies are sent automatically. |

### Cleanup verification

- `npm run build`: 21 complete public HTML pages generated.
- `npm run check`: no errors across 21 pages, 668 internal links, 192 asset
  references and two active forms; JavaScript syntax and HTML checks included.
- `npm run validate:html`: 22 files, no issues.
- `npm test -- tests/portfolio.spec.cjs tests/phase3.spec.cjs tests/client-sites-team.spec.cjs`:
  all 22 relevant browser tests passed. Coverage includes both URL mounts,
  project links and assets, larger previews, filters, no-JavaScript fallback,
  enlarged-text reflow and unchanged homepage selection.
- Four caption-cleanup cases cover 375px/1440px in dark/light themes. They check
  all cards for removed notes/containers, retained disclosures, loaded images,
  bounded content, no horizontal overflow, and zero automated WCAG A/AA issues
  in the homepage project section and Portfolio grid.
- Visually reviewed both pages at both widths in both themes. Screenshots remain
  aligned; caption containers and their spacing are absent. Captures are retained
  under ignored `test-results/portfolio-project-cards-*` directories. Fixed site
  controls may overlay long region captures at the viewport position; their
  behavior and styling were not changed by this cleanup.
- Compared every project and homepage record with the previous commit. All fields
  except captions and demo disclosures are unchanged. No image asset changed.
- `git diff --check` passed. The final diff excludes hosting configuration, DNS,
  SSL, analytics/consent, chatbot, WhatsApp and deployment workflows.

Local browser checks use installed Chrome with desktop/mobile viewports, not
physical mobile devices or other browser engines. Forms remain mocked in browser
regression checks. The existing deployment workflow runs the complete suite
before uploading; CI and post-deployment results are reported with the release.
