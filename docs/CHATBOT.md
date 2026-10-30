# Ask RumiWare maintenance

This is a static, rule-based FAQ assistant. It has no provider, API, backend, new account, tracking, transcript storage or automatic WhatsApp messages.

## Content and sources

Edit `src/data/chatbot-faq.json`: stable `id`, `category`, canonical `question`, realistic `alternates`, prepared `answer`, optional `links` with `label` and `url`. The current collection has 96 entries in 14 categories. Adding 150 or 200 entries does not require UI changes: categories and question choices derive from the array.

Verify company claims against `site.json`, `services.json`, `team.json`, `projects.json`, `commercial.json`, FAQ and service/process/blog pages. General explanations (domain, hosting, HTTPS, accessibility, landing pages) must remain distinct from offered services. WordPress evidence is the Rumi Dental Care project. SchoolOS evidence does not establish individual administration modules. The Enquiry Assistant is a separate demo with AI-assisted drafting; this FAQ widget is not AI.

Do not add prices, deadlines, guarantees or unconfirmed policies. Pricing, delivery dates, payment arrangements, discounts, support response terms, backup schedules, technical compatibility and project-specific feature requests require the team or a written quote. Review facts whenever source content changes; these answers intentionally summarize rather than automatically copy old marketing promises.

`scripts/validate-chatbot.cjs` runs during every build. It rejects duplicate IDs, empty fields/answers, missing alternates, conflicting normalized variants and destinations outside known pages and verified project/WhatsApp URLs. Add any new external destination deliberately to the validator's allowlist after verifying it. Answer HTML is not supported. The builder embeds escaped JSON and copies only the two production scripts; source JSON, docs and tests are not published as development files.

## Resolver and UI boundary

`src/assets/chatbot-resolver.js` exports `createResolver(entries)`, returning a pure `resolve(question)` function. Results are `{type:'answer', entry}`, `{type:'topics', answer, ids}` or `{type:'fallback', answer}`. Browser and Node tests share this implementation. Normalization handles case, whitespace, punctuation and a small documented spelling dictionary. Exact prepared variants win; partial matches require at least two meaningful words, complete coverage of those words and a score of at least 0.7. Close scores produce choices. Unrecognized combined requests produce categories. Unknown qualifiers are never discarded to force a match. Expand realistic alternate phrases rather than making thresholds permissive.

The exact fallback is `For help with this question, please contact our team on WhatsApp.` The UI immediately adds a `Chat on WhatsApp` link using `site.json`'s existing destination; the latest question is not added to its URL. A persistent contact link is always inside the panel. Requests for a person use this fallback.

`src/layout/chatbot.html` provides the shared non-modal region on the 20 normal public pages (the error recovery page remains unchanged); `src/assets/chatbot.js` owns memory-only messages, text rendering, topic buttons, viewport fitting and focus. Escape returns focus to the launcher; Tab can leave the panel. Responses are announced in a separate polite status region, so the whole history is not reread. New conversation and reload clear messages. History is bounded to 80 rendered messages. `src/assets/chatbot.css` uses the existing themes and stacks back-to-top, chatbot and WhatsApp controls. All three chatbot assets have content-versioned URLs so existing site caches cannot hide the new feature. Privacy settings hide floating controls and close the panel; short viewports prioritize the panel and its internal WhatsApp link. VisualViewport changes keep the composer visible above a mobile keyboard.

A future server-side AI/hybrid resolver can implement the same result contract and replace the resolver invocation (with async handling) without rebuilding the interface. Define privacy, request handling and failure behaviour as part of that separate upgrade. Do not put provider secrets in these static assets or add placeholder network calls.

## Verification

Run `npm run build`, `npm run check`, `npm test` and `python scripts/test-hostinger.py`. On Windows PowerShell use `npm.cmd` if script execution policy blocks `npm.ps1`.

`tests/chatbot.spec.cjs` covers data validation, all prepared variants, conservative/ambiguous matching, exact fallback and destination, human requests, safe input rendering, keyboard/focus, quick replies/reset, both themes, root/nested/preview URLs, screen sizes, floating-control spacing, privacy collision, simulated keyboard viewport changes, accessibility and no conversation requests/storage.

Before publishing, review the FAQ for new unsupported business commitments and verify homepage plus nested article behaviour after the existing Hostinger workflow completes. Deployment workflows and credentials are outside this feature's scope.
