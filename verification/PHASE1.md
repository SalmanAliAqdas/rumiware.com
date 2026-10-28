# Phase 1: Production readiness

Completed locally on 28 October 2026 (Asia/Karachi), on branch `phase-1-production-readiness`. Starting checkout was clean and HEAD was `31e50cc92dc022cc46542e3ab8da95b3145f1f0d`. No applicable AGENTS.md was found in the checkout or its ancestor directories. No push, merge, deployment, external account changes or history rewrite was performed.

## Implemented changes

- Removed the homepage's sample testimonials and unverified numerical achievements. The four existing team profiles and photos remain.
- Replaced sample vacancies and their application form with “No current openings.” Kept the old `#apply` anchor available as the hiring-status section.
- Removed all newsletter controls, including those with concrete IDs: an enquiry endpoint alone does not verify a subscription system. Every footer explains availability and retains email and WhatsApp alternatives.
- Preserved contact endpoint `mvkzkdbv` and quote endpoint `mkjojozj`. The existing quote-preview URL now uses the same maintained quote implementation and endpoint, with noindex and the production quote canonical. It remains a working sales form, not a sandbox form.
- Added a shared 15-second request timeout, in-flight duplicate protection, preserved values on failure, live feedback, disabled pending controls, and success only after a successful HTTP provider response. No automatic retry occurs. Timeout feedback explicitly says receipt is unconfirmed.
- Fixed quote submission by Enter on an earlier step: it now validates and advances rather than sending an incomplete enquiry. Final submission rechecks all steps. Validation errors are associated with their controls.
- Removed Google Analytics loading entirely. Existing Accept preferences do not enable tracking. Every complete page has keyboard-accessible Privacy settings for declining/withdrawing older acceptance; the preference is stored and accessible legacy GA cookies are expired on known path/domain scopes. Other-domain and HttpOnly cookies cannot be removed by this code.
- Updated privacy text to describe local storage, disabled analytics, Formspree, Google Fonts, Google Maps and external contact links. Essential functionality is independent of analytics.
- Fixed 404 resolution at the production root and exact `/rumiware.com/` preview mount, including nested missing URLs. JavaScript-free recovery uses fully qualified production links and readable inline fallback styling. The 404 document never redirects the visitor or changes the missing URL.
- Fixed homepage Home/favicon paths for repository hosting. Production canonicals remain on `https://rumiware.com/`.
- Retained only the actual mobile-website article, corrected article/social metadata and added it to the sitemap. Removed template publication and sitemap modification dates whose history was not verified.
- Added a 1200 × 630 branded sharing PNG (34,959 bytes) and editable SVG using the existing vector robot and colors. Updated page-specific sharing descriptions and favicon references across pages and templates.
- Fixed malformed contact-map section nesting, added the map's accessible title, and kept breadcrumbs visible on narrow screens without altering the main mobile menu.

## Verification results

`npm.cmd test` completed successfully: **20 tests passed in 1.7 minutes**, using installed Chrome through Playwright. `node --check script.js` and `git diff --check` also passed.

| Check | Actual result |
| --- | --- |
| HTML inventory | All 24 HTML files served at root and repository mounts; 21 complete documents plus three shared fragments |
| Internal navigation | 1,320 link occurrences and 62 anchor occurrences resolved across both mounts |
| Local resources | 148 stylesheet/script/image reference occurrences resolved; no page JavaScript errors during the page crawl |
| Forms | 27 original forms inventoried; three active sales forms remain; six action checks across both mounts passed |
| Contact and both quote URLs | Mocked HTTP 200, HTTP 422 rejection, network failure and 15-second timeout passed; pending UI, duplicate guard and retained failure values checked |
| Validation | Contact required fields/email and quote service, project description, email and consent rejected invalid input without provider submission |
| Analytics | No analytics requests before a choice, with a saved legacy Accept, after Decline, across pages, or after withdrawal; legacy GA cookie cleanup checked |
| 404 | Actual local HTTP 404 for shallow/nested missing routes at both mounts; CSS, script, favicon and Home recovery verified; JavaScript-disabled recovery also checked |
| Social assets | PNG dimensions/size checked; all complete pages reference the real image and consistent favicon; production canonicals and page-specific descriptions checked |
| Responsive/theme checks | Homepage, careers, blog, contact, quote, privacy and nested 404 inspected at 1440px and 390px, dark and light; no horizontal overflow detected |
| Keyboard checks | Contact field tab order, mobile menu Enter/Escape, privacy opening, Decline, Escape and focus restoration passed |
| Screenshots | 36 PNGs captured; representative careers, blog, sharing asset, form rejection, 404 and privacy settings images visually inspected |

See the [complete form inventory](form-inventory.md) and [screenshot index](screenshots.md).

Provider requests were intercepted: **no test message, application or subscription was submitted to a real account**. Successful mocked requests prove UI handling, not provider setup or email delivery. Fonts and the Google Maps embed were intercepted for deterministic local checks; their external availability/content was not validated by these screenshots. Keyboard and semantic feedback checks are automated; this was not a screen-reader or legal-compliance audit. Local checks used Chrome only.

## Read-only checks of existing live hosting

These GETs checked the existing deployed version, independently of the local changes:

| URL | Observed HTTP status |
| --- | --- |
| https://rumiware.com/ | 200 |
| https://rumiware.com/phase1-check-missing/nested | 404 |
| https://salmanaliaqdas.github.io/rumiware.com/ | 200 |
| https://salmanaliaqdas.github.io/rumiware.com/phase1-check-missing/nested | 404 |

The changed 404 rendering and assets were verified locally only. A local preview server cannot establish future production-host behavior; after an owner-approved deployment, recheck the changed 404 body/assets on both real hosts. No redirect configuration was added. The browser-source fetch service could not open the two live pages; read-only Python HTTP requests succeeded instead.

## Files changed

Shared footer notices, privacy controls and sharing metadata affect every complete page; the site remains HTML, CSS and vanilla JavaScript. Node/Playwright are development-only tools, with no runtime build or framework requirement.

Modified existing files:

```text
404.html                 about.html               ai-solutions.html
blog-post.html           blog.html                careers.html
contact.html             faq.html                 footer.html
full-stack.html          get-quote-preview.html   get-quote.html
head.html                index.html               mobile-apps.html
portfolio.html           pricing.html             privacy.html
process.html             script.js                services.html
sitemap.xml              style.css                team.html
terms.html               web-development.html
```

New files:

```text
.gitignore
images/social-preview.png
images/social-preview.svg
package.json
package-lock.json
playwright.config.cjs
scripts/serve.mjs
scripts/social-preview.cjs
scripts/form-inventory.cjs
tests/phase1.spec.cjs
tests/stop-preview.cjs
verification/PHASE1.md
verification/form-inventory.md
verification/screenshots.md
verification/screenshots/*.png (36 screenshots)
```

## Owner configuration and facts still needed

- **Newsletter:** supply a real mailing-list provider, the intended list/audience, its supported public signup endpoint or documented integration, sender verification, confirmation/opt-in behavior, unsubscribe handling, and approved signup wording. Keep this separate from the contact/quote forms. Do not place private provider credentials in static HTML or browser JavaScript.
- **Sales forms:** endpoints were preserved, not proven to deliver. The account owner should confirm domain permissions, recipient addresses, spam settings and notification delivery through Formspree. No endpoint replacement is needed based on this phase's evidence.
- **Content:** supply approved testimonials and supporting project/client totals before restoring them; confirm genuine vacancies before restoring applications. Confirm the article's actual publication date before adding date metadata. Existing contact details, team profiles and portfolio facts were retained from source.
- **Analytics:** deliberately off, so no analytics credentials are needed to complete this phase. Re-enabling it is a separate owner decision requiring a tested consent integration and matching privacy wording. Google Fonts and the contact map remain external requests independently of analytics.

No missing owner configuration blocks the implemented Phase 1 changes.

## Exact local commands (PowerShell)

```powershell
Set-Location 'C:\Users\SALMAN\Downloads\rumiware.com\RumiWare'

# Preview needs only Node; no installation or build is required.
node scripts/serve.mjs
```

Open `http://127.0.0.1:4173/` and `http://127.0.0.1:4173/rumiware.com/`. For real local 404 responses, open `/nested/missing` and `/rumiware.com/nested/missing`. Stop the preview with Ctrl+C.

In another PowerShell terminal:

```powershell
Set-Location 'C:\Users\SALMAN\Downloads\rumiware.com\RumiWare'
npm.cmd ci --cache .npm-cache
npm.cmd test
node --check script.js
git diff --check
node scripts/form-inventory.cjs
```

The test runner starts/stops its own preview if one is not already running. A manually started preview stays running. Chrome is selected at `C:/Program Files/Google/Chrome/Application/chrome.exe`; set `$env:CHROME_PATH` to another installed Chromium executable if needed. The exact npm installation used here was `npm.cmd install --save-dev @playwright/test --cache .npm-cache --fetch-retries=0`; subsequent runs use the committed lockfile with `ci`.

To regenerate the social PNG from the homepage mascot and SVG layout:

```powershell
npm.cmd run social-image
```

Use the existing static-host upload process for public HTML/CSS/JS, images, robots.txt and sitemap.xml when deployment is separately authorized. Do not upload development dependencies, npm caches, tests or verification screenshots. No Phase 2 work or deployment was performed.
