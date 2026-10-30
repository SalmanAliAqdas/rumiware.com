# Consent-based page analytics

Public configuration is in `src/data/site.json`: `analytics.measurementId`, exact
HTTPS production origins and the versioned `rw-analytics-v1` preference key.
Legacy `rw-cookie` acceptance is ignored. Any future material consent change must
use a new key. Choice is local to each browser/origin. With storage blocked,
acceptance lasts only for the current document and the visitor is asked again.

`script.js` starts measurement only on a known public production route with
current acceptance. Preview mounts, localhost, other hosts and noindex/error
pages cannot activate it. Each document initializes at most once. Reaccepting
after withdrawal on the same document takes effect on the next page load, so it
cannot duplicate that document's page view.

The tag runs in `analytics-frame.htm`, a separate same-origin document with no
forms, chat, links or application history. It waits for the consent controller's
origin/source-checked message. It receives only build-time canonical page URL and
title, sanitized referrer, and configuration. The frame's own URL contains no
visitor query/fragment; a no-referrer policy prevents raw parent URLs reaching
Google through HTTP referrer headers. No custom content events are wired up.
Automatic measurement sees the frame document, not the enquiry forms.

Google loads asynchronously after acceptance. `send_page_view:false` prevents
the config event from duplicating the one explicit `page_view`. Advertising
consents are denied; Google signals and ad personalization are disabled. Normal
GA lifecycle/session metadata can accompany the basic page measurement.
Withdrawal first sets Google's documented `ga-disable-MEASUREMENT_ID` flag,
then removes the frame (and its timers/listeners), then expires accessible GA
cookies at known domain/path scopes. Existing in-flight requests or data already
received by Google cannot be recalled. Cross-tab changes and cleared storage
also stop collection. No denied-state/cookieless pings are sent.

## Google Analytics dashboard (manual, Editor access)

For web stream `G-DM1NSE0FJ0`, open Admin → Data collection and modification →
Data streams → the web stream. Turn **Enhanced measurement OFF** for the initial
basic-page-only rollout. This includes **Form interactions**, site search,
scrolls, outbound clicks, video, downloads and browser-history page changes.
Also review Google tag → Manage automatic event detection and disable these
automatic interactions. Keep Google signals and user-provided data collection
off, and review linked destinations so no additional tags/destinations are
configured remotely. The repository cannot inspect or change these settings.
Do not add a second tag through Hostinger, Tag Manager or another integration.

## Verification

`npm run build`, `npm run check`, `npm test` and
`python scripts/test-hostinger.py` run the release checks. `tests/analytics.spec.cjs`
uses production-origin requests served from the local build and intercepts all
Google tag/collection traffic. Its default deterministic tag fixture checks
queued config/events without any external service. To also exercise the actual
Google library, download the public script for this measurement ID to a local,
untracked file and set `GA4_TAG_FIXTURE` to that path before running the spec.
All collection requests remain intercepted, including in real-library tests.
Never use an un-intercepted acceptance during live QA unless intentionally
sending and clearly reporting a real production test event.

Official implementation references:

- [Basic consent mode](https://developers.google.com/tag-platform/security/guides/consent)
- [Manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Privacy and the GA disable flag](https://developers.google.com/tag-platform/security/guides/privacy)
- [Cookie and page-field configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Enhanced measurement settings](https://support.google.com/analytics/answer/9216061)
