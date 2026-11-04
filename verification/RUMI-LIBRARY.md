# Rumi Library portfolio update — November 5, 2026

## Verified project and capture

- Public site: https://rumi-library.vercel.app/
- Repository: https://github.com/SalmanAliAqdas/rumi-library-system
- Read the public repository's `README.md` and `requirements.txt`. These confirm
  Python/Django, server-rendered HTML templates, CSS and vanilla JavaScript.
- Visited only the public homepage, `/books/` and `/offline/`. The catalogue was
  empty. Public controls expose book search, subject, book-language and
  availability filters, English/Urdu/Arabic interface choices, and optional
  offline public browsing. The description does not claim populated books,
  users, results or usage metrics. Offline download was not exercised.
- No library forms were submitted, private administration accessed or library
  records changed. No generated imagery or screenshot service was used.
- Captured the public homepage in headless Chrome at 1600×1000 after network idle,
  `document.fonts.ready` and image decoding. No obstructive overlay was present.
  Original: `reference/project-captures/rumi-library.png` (78,025 bytes).
- Pillow RGB conversion and Lanczos resizing preserve the original 16:10 ratio.
  WebP quality 86, method 6 matches the existing preview optimizer:
  `images/projects/rumi-library.webp` (1280×800, 28,570 bytes) and
  `images/projects/rumi-library-640.webp` (640×400, 10,956 bytes).

## Implementation and preservation

The shared `src/data/projects.json` record supplies both pages, responsive
previews, alt text, intrinsic dimensions, links and filters. No builder or layout
exception was added. Library Management belongs to Business Applications.

The homepage still has three cards, ordered SchoolOS, Rumi Enquiry Assistant,
Rumi Library. Only Expense Tracker's `featured` flag changed; all its remaining
fields and screenshot assets are preserved. All other existing project records
are identical to the previous revision. The existing Enquiry Assistant homepage
presentation and PDF Toolkit Portfolio record are preserved.

The Portfolio card uses the existing larger-preview behavior and external-link
markup. Live Demo and View Code use the requested destinations with
`target="_blank" rel="noopener noreferrer"`. Both WebP assets are copied into
`dist/` by the existing build. README project listing and affected browser
expectations were updated, with focused coverage for the new entry.

## Local verification

- `npm run build`: 21 complete HTML pages generated.
- `npm run check`: no errors; 21 pages, 668 internal links, 192 asset references,
  two active forms. Included JavaScript syntax and HTML validation.
- `npm run validate:html`: 22 files, no issues.
- `npm test`: all 129 Playwright tests passed, including analytics/consent,
  sharing, articles, chatbot, forms (mocked), navigation, accessibility, responsive
  reflow and Portfolio coverage. The new Library test passed at both widths and
  in both themes.
- Targeted Chrome review: homepage and Portfolio at 375px and 1440px in dark and
  light themes. Library appears once on each page; images decode, dimensions are
  reserved, both project links match, filters show/hide it appropriately, Expense
  Tracker remains in Portfolio, and the other homepage cards retain their order.
  No horizontal overflow or browser page errors in those checks.
- Both locally served WebP files return HTTP 200 and SHA-256 hashes identical to
  their source files. Production build copies are also byte-identical.
- Compared all existing project records to the previous revision, allowing only
  Expense Tracker's featured flag. Final source diff excludes hosting, DNS, SSL,
  redirects, credentials, forms, analytics, sharing and chatbot configuration.
- QA screenshots are retained locally under ignored `test-results/`, including
  `local-library-home-{width}-{theme}.png` and
  `local-library-portfolio-{width}-{theme}.png`.

Browser verification uses installed desktop Chrome with mobile viewports;
physical mobile devices and other browser engines were not tested.

The release's full browser-suite result, commit, Hostinger Actions result and
post-deployment HTTP/browser verification are reported with the delivery.
