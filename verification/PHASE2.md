# Phase 2: Accessibility, responsive behavior and reliability

Implemented locally on `phase-1-production-readiness`, continuing the existing uncommitted Phase 1 work. No commit, push, merge, deployment or external account change was made. The site still uses static HTML, CSS and vanilla JavaScript; the additional npm packages are development-only validation tools.

## Starting checks

Read the applicable instruction locations (no AGENTS.md found), `verification/PHASE1.md`, both shared scripts/templates and the Phase 1 tests before editing. Inspected the current implementation instead of treating every earlier finding as unresolved.

The browser observations in [phase2/before.json](phase2/before.json) confirmed that:

- Normal-motion visitors without JavaScript received reveal content with opacity zero.
- The quote page focused its first legend on arrival and accepted an arbitrary `plan=unverified` query value.
- An open mobile menu still announced “Open menu.” Main-menu rules also applied globally to navigation elements, with a separate breadcrumb exception.
- Normal-size text did not overflow at the six requested viewport widths in the starting browser check. The main header was nevertheless tightly coupled to a fixed viewport breakpoint, so it also needed testing with enlarged text.

Phase 1 had already repaired contact-section nesting, added a map title, revalidated all quote steps before sending and cleared errors after successful step validation. These behaviors were retained and extended. The remaining map defects were malformed attribute spacing, a percentage width attribute, inconsistent styling and the spelling “Socity.”

## What changed and why

### Navigation

Main-menu rules now target `#nav`, independently of breadcrumbs, service jump links and footer navigation. The header uses a container breakpoint of 68.6875rem: at the normal 16px root size this switches below 1100px, giving the menu room near 960/1024px. Because the breakpoint uses rem units, it also switches when text grows even if the outer viewport stays wide. Desktop navigation keeps its existing layout when it fits.

The disclosure reports accurate Open/Close names and `aria-expanded` state. Enter/Space work through the native button. After opening, Tab enters the first menu link. Selection, focus departure and outside clicks close it; Escape closes it and returns focus to the button. Resizing from desktop to compact navigation returns focus if the focused link becomes hidden. This is an ordinary navigation disclosure, with native links, rather than an ARIA application menu.

Without JavaScript, navigation stays visible and wraps normally. Script-dependent theme/menu controls appear only after their handlers initialize. Breadcrumbs remain static, visible and independently labelled. Skip links now focus their main-content target.

### Progressive enhancement and reduced motion

Essential content is visible by default. Reveal effects become eligible only after an IntersectionObserver is successfully constructed and attached. Missing/failed observers leave content visible. Reduced-motion visitors receive visible content without reveal animation or smooth scrolling; switching that preference while a page is open also reveals content and stops the optional slider timer.

Both quote URLs show an accessible email/WhatsApp alternative until the complete wizard initializes. A blocked or failed shared script therefore does not leave visitors with an unusable partial wizard. The contact form retains its ordinary HTML POST fallback.

### Contrast, focus and touch controls

Gold text has its own darker light-theme token; gold buttons and badges retain their gold backgrounds. Light-theme teal emphasis is darker, dark-theme errors are lighter, and technology chips use white text on their teal hover background. Placeholder thumbnails use darker brand teal so their white labels remain readable. The existing light-theme error color already passed and was retained.

Contrast ratios below use WCAG relative luminance. Starting values were calculated from the original CSS foreground/background values; final values were measured from browser-computed colors, including composited translucent backgrounds.

| Text treatment | Before | After | Normal-text AA minimum |
| --- | ---: | ---: | ---: |
| Light gold text on page background | 2.25:1 | 5.44:1 | 4.5:1 |
| Light teal emphasis on page background | 2.80:1 | 5.54:1 | 4.5:1 |
| Light technology-chip hover | 2.47:1 | 5.93:1 | 4.5:1 |
| Dark error text on form card | 4.26:1 | 6.80:1 | 4.5:1 |
| Light error text on form card | 6.96:1 | 6.96:1 | 4.5:1 |

See [dark measurements](phase2/contrast-dark.json) and [light measurements](phase2/contrast-light.json). Tests also check visible 3px keyboard focus and non-text contrast against the 3:1 requirement. Form outlines have stronger contrast. Theme/menu/social buttons have 44px targets; filters and navigation links have at least 44px height. Breadcrumb links have 32px height. Selected radio cards gain a checkmark, selected filters and current-page menu links gain underlining, and errors include explanatory text as well as a border/color change.

Enlarged text uncovered real overflow in the header and homepage at 320px, and in the desktop header at 1440px. Wrapping, minimum grid sizes, bounded buttons/chips, and the text-sensitive header breakpoint fix those cases without hiding horizontal overflow. Contact details and long review content can wrap.

### Quote wizard and form feedback

- No focus moves on initial arrival. User-triggered Back/Next transitions focus their step legend; failed validation focuses the first invalid field after making its step visible.
- Required inputs have native required semantics and a clear explanation; optional inputs remain labelled optional. Project details require at least 20 characters and names at least two.
- Errors are associated with their fields. Validated steps update on input/change, removing stale `aria-invalid` state as fields are corrected while retaining errors on fields still invalid.
- Only the existing pricing query values `starter`, `business` and `enterprise` are accepted. The corresponding package is displayed; unknown or special values produce no selected package.
- The existing fourth step includes a concise review of the selected package, service, project, budget, timeline and optional links. Review text uses DOM text nodes, so supplied project details are never interpreted as HTML.
- Submission still revalidates the entire brief. It returns to and focuses an earlier invalid step instead of sending incomplete data.
- Phase 1's provider endpoints, successful-response requirement, 15-second timeout, duplicate guard, retained failure values and unconfirmed-receipt wording remain. Pending/success/failure live messages are outside the busy form so the pending announcement is not queued behind its own `aria-busy` state. Failures focus readable feedback; successful quotes focus the existing confirmation panel.

### Contact, theme and script reliability

The map keeps its existing location, embed URL and descriptive title. Its attributes are valid HTML, dimensions/border/radius are defined consistently in CSS, and the address spelling is now “Revenue Society.” Business facts and contact details were not changed.

Every complete page and the head template applies the saved, allowlisted theme before styles paint. `color-scheme` follows that theme for native controls. Storage reads/writes are guarded; theme toggling and forms still work when localStorage throws. The shared header template now matches the real header and provides a closed main container instead of malformed open markup.

Page-specific initializers check their required elements before attaching handlers. A missing menu, privacy-status element or quote progress element cannot break the theme or unrelated content. Cookie access is guarded. A failed quote initialization leaves the contact alternative visible. Optional analytics remain disabled, and Phase 1 privacy settings/cookie retirement remain intact.

## Files changed in Phase 2

The list below describes changes relative to the Phase 1 working tree, not the cumulative Git diff against the original first-version commit.

| Files | Purpose |
| --- | --- |
| All 21 complete HTML pages | Early theme initializer, focusable main target and explicit shared-button types |
| `get-quote.html`, `get-quote-preview.html` | Fail-safe contact alternative, required inputs, package display, final review, independent live feedback |
| `contact.html` | Address spelling, valid iframe attributes and independent live feedback |
| `services.html` | Service jump links use a named navigation landmark |
| `head.html`, `header.html`, `footer.html` | Keep shared fragments consistent and valid |
| `style.css` | Scoped responsive navigation, enhancement-only reveal, AA colors, focus/selection/touch improvements, text resizing, native color scheme and map styling; removed the duplicated stylesheet prefix |
| `script.js` | Navigation/focus behavior, guarded initializers, reduced motion, quote improvements and feedback |
| `package.json`, `package-lock.json` | Development-only axe/HTML validation dependencies and check scripts |
| `scripts/validate-html.cjs` | Standards-based validation of all 24 HTML files |
| `tests/phase2.spec.cjs` | 25 targeted accessibility/responsive/reliability tests |
| `tests/phase1.spec.cjs` | Only adds an optional screenshot-output directory override; all Phase 1 assertions remain |
| `verification/PHASE2.md`, `verification/phase2/*` | Starting observations, final measurements, scan results and screenshots |

Complete pages are `404.html`, `about.html`, `ai-solutions.html`, `blog-post.html`, `blog.html`, `careers.html`, `contact.html`, `faq.html`, `full-stack.html`, `get-quote-preview.html`, `get-quote.html`, `index.html`, `mobile-apps.html`, `portfolio.html`, `pricing.html`, `privacy.html`, `process.html`, `services.html`, `team.html`, `terms.html` and `web-development.html`.

Phase 1's sitemap, social-preview assets, provider configuration, content removals and public URLs were retained. Existing user edits, including contact-page social-link spelling/capitalization, were preserved.

## Final checks and actual results

`npm.cmd test` completed successfully: **45 tests passed in 5.0 minutes** (20 Phase 1 regressions and 25 Phase 2 tests). The final run reported no failed tests. HTML validation, JavaScript syntax and Git whitespace checks also passed.

| Check | Coverage / result |
| --- | --- |
| Full Phase 1 suite | All 20 original assertions/tests, with mocked form success/rejection/network/timeout responses, duplicate protection, retained values, privacy, analytics absence, internal URLs/assets and actual local HTTP 404 responses |
| Responsive matrix | All 21 complete pages at 320, 375, 768, 960, 1024 and 1440px in both themes: 252 page/width/theme combinations; no horizontal overflow or header overlap detected |
| Main navigation | Keyboard entry, current state/name, selection, Escape, focus departure and desktop/compact resize checks |
| Progressive enhancement | 20 complete non-404 pages checked at 320px with JavaScript disabled and normal motion; Phase 1 separately checks the JavaScript-free 404 |
| Shared-script failures | Blocked shared-script request, throwing IntersectionObserver, missing optional nodes and blocked localStorage checked without unrelated console errors |
| Quote | Required semantics, plan allowlisting (including special values), no arrival autofocus, transition focus, stale-error cleanup, review and invalid earlier-step rejection checked; Phase 1 covers provider outcomes on both quote URLs |
| Contrast | Browser-computed foreground/background checks in both themes; normal text ≥4.5:1, focus/non-text checks ≥3:1 |
| Automated accessibility | Axe WCAG A/AA scans on all 21 complete pages plus final quote step and privacy settings in each theme: 46 scans, zero violations |
| 200% | Reflow equivalent to a 1440px physical viewport at 200% zoom (720 CSS pixels at DPR 2), plus text doubled to 200% at all six requested widths in both themes on homepage/contact/quote/services; no horizontal overflow |
| Reduced motion | Reveal visibility, transitions, scrolling and live preference changes checked |
| HTML | `html-validate:standard` checked all 24 HTML files: zero issues; source-format-only void-tag/whitespace preferences are omitted |
| JavaScript / diff | `node --check script.js` and `git diff --check` passed |
| Screenshots | 33 Phase 2 screenshots plus 36 Phase 1 regression captures in a separate directory; desktop/mobile, both themes, menus, quote review/errors, contact, no-JavaScript and zoom reflow |

The combined run also checked 1,320 internal-link occurrences, 62 anchors and 148 local resource references across the root and repository mounts. Active forms still contain only the preserved concrete contact/quote actions. No production form submission was made.

Raw accessibility results: [dark](phase2/axe-dark.json), [light](phase2/axe-light.json). [Screenshot index](phase2/screenshots.md).

## Exact local commands

PowerShell:

```powershell
Set-Location 'C:\Users\SALMAN\Downloads\rumiware.com\RumiWare'
npm.cmd ci --cache .npm-cache

# Keep new regression captures separate from the original Phase 1 screenshots.
$env:RUMIWARE_SCREENSHOTS_DIR = 'verification/phase2/phase1-regression'
npm.cmd test
npm.cmd run validate:html
node --check script.js
git diff --check
```

To run one suite: `npm.cmd run test:phase1` or `npm.cmd run test:phase2`. The test runner uses installed Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`; set `CHROME_PATH` for another Chromium executable if needed. It starts a local server if no preview is running.

Preview, with no dependency installation or build required:

```powershell
Set-Location 'C:\Users\SALMAN\Downloads\rumiware.com\RumiWare'
node scripts/serve.mjs
```

Open `http://127.0.0.1:4173/` and `http://127.0.0.1:4173/rumiware.com/`. Use Ctrl+C to stop a manually started preview.

## Remaining limitations

- Checks used local Chrome/Chromium. Safari, Firefox, real phones and screen-reader speech output were not tested. Automated zero-violation results are not a complete accessibility conformance assessment.
- Zoom was tested through equivalent CSS-viewport/device-scale reflow and actual 200% text resizing, rather than manually operating Chrome's browser-chrome zoom UI. Default-font browser behavior was checked; Google Fonts and the map embed were intercepted for deterministic screenshots, so the map area is deliberately blank in captures. Their live service behavior was not verified.
- Form requests were mocked. No email delivery, production account configuration or real enquiry receipt is claimed. Newsletter/provider facts still needed from the owner remain as documented in Phase 1.
- Production was not deployed or reconfigured. Hosting behavior of these new changes is verified locally only. Re-enabling analytics remains outside this phase; analytics are still off.

No broader design work or deployment was performed.
