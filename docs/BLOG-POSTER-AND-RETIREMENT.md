# AI poster and mobile-website article retirement

Date: 2 November 2026. Baseline commit: `491e38e250a5dfc53a50b67dbdcefcac3853ea33`.
These are two blog changes: artwork for the existing Future of AI article, and
retirement of the Fast Mobile Website article. Supporting hosting and test changes
exist only to publish those changes safely.

## Original AI artwork

Built-in image generation produced `images/blog/future-of-ai-original.png`
(1730×909). `scripts/future-ai-poster.py` uses the existing Pillow tooling to fit
the whole composition into 1200×630, padding rather than cropping, and exports:

- `images/blog/future-of-ai-cover.webp`: 1200×630, article poster.
- `images/blog/future-of-ai-cover-640.webp`: 640×336, responsive poster and Blog card.
- `images/blog/future-of-ai-social.png`: 1200×630, Open Graph, Twitter and BlogPosting image.

The original is retained in Git; only the three delivery assets enter `dist/`.
The visible article prose, title, author, publication date (30 October 2026) and
clean URL remain unchanged. `dateModified` is 2 November 2026.

Final generation prompt (built-in mode; no API key or paid account added):

> Use case: illustration-story. Create an original professional editorial illustration for RumiWare's article 'The Future of AI: What It Means for Businesses, Jobs, and Everyday Life'. Wide landscape composition, approximately 1.9:1, designed to be resized to a 1200x630 web poster and social image. Three calm, connected human scenes: at left a professional collaborating with a subtle AI interface on a laptop; at center a learner with an open book and a simple assistive interface; at right a person organizing an everyday task on a tablet, with a small calendar/checkmark motif. Show people as capable, in control, with AI as helpful supporting abstract shapes and soft connecting paths. Clean sophisticated flat editorial illustration, restrained geometric forms, refined soft texture and clear large silhouettes that remain legible at thumbnail size. RumiWare palette: deep navy #0B1E2D background, teal #16A6A3 and #3FD0CB, warm cream #F4EEDD, subtle gold #D9B65C accents. Balanced generous negative space, all key artwork within generous safe margins to fit 1200x630 without cutting off figures. Modern, warm, thoughtful and optimistic. No text, no letters, no tiny labels, no statistics, no logos, no watermarks, no ominous robots, no sensational imagery, no claims of guaranteed AI abilities.

## Retirement scope and inspection

Pinned, read-only SSH confirmed the exact real document root
`/home/u721646606/domains/rumiware.com/public_html`, with no ancestor `.htaccess`.
The existing root rules matched SHA-256
`3f341c8cc89e139026ed9e01db0126f79da6359cbb509085c093eae88fab5347`.
The clean article was serving 200 before retirement.

`config/mobile-article-retirement.json` records the four URLs and the two actual
published file checksums inspected before changing anything:

| File | SHA-256 |
| --- | --- |
| `blog-post.html` | `2dfbe14cb37fa8ecf4a6f7f66a73d76ba3e99a5628a698eaceea50acc1b75b76` |
| `blog/fast-mobile-website/index.html` | `3d9c23a5c50d74661183a418d59844330d1d7bcdda41a012905c114e01163648` |

The directory contained only `index.html`. No article-specific image was found
or removed. Every other article and image is retained.

The source page, page metadata, route, Blog card and old recommendations are
removed. Chatbot logic and its 96-entry inventory remain; the affected answers
stop recommending the retired article and point to the current Blog listing
where appropriate. No forms, consent/Analytics logic, WhatsApp, featured project
inputs, DNS, TLS, CDN or Force HTTPS settings are changed.

The generated `.htaccess` replaces only the two obsolete article redirects with
an exact-path 410 rule, before canonical-host handling. Paths are `/blog-post.html`,
`/blog/fast-mobile-website`, its trailing-slash URL, and its `index.html` URL.
Queries do not change the 410 outcome. Other clean-URL rules, DirectoryIndex
guards, canonical-host rules and `ErrorDocument 404` are byte-identical.
The local preview models the status; it does not execute Apache/LiteSpeed rules.

## Reviewed deployment and private quarantine

The sole additional permitted root-configuration transition is:

`3f341c8cc89e139026ed9e01db0126f79da6359cbb509085c093eae88fab5347`
→ `a2db54ab781fb142fa9d23110b5d031e375a84c8289b0d3ce277d3c330fd3bd7`.

The historical www transition remains supported for its existing safety fixtures
and recovery records. No arbitrary hosting-file overwrite is permitted. Normal
deployment still creates and reads back a full private backup, checks for concurrent
changes/conflicts, preserves remote-only files, and activates `.htaccess` last.

Before pushing, create a private preparation backup with the existing helper:

```powershell
python scripts/retire-mobile-article.py --backup-ssh u721646606 C:\Users\SALMAN\.ssh\rumiware_hostinger C:\Users\SALMAN\.ssh\rumiware_known_hosts
```

Retain the printed `.deployment-backups/RUN-ATTEMPT/site.tar` path, its checksum
and snapshot outside `public_html`. The workflow independently creates its normal
verified backup.

The preparation backup for this release was created and read-back verified at
`/home/u721646606/domains/rumiware.com/.deployment-backups/1793583054-1/site.tar`.
It contains the original root configuration and both inspected article files.

After confirming the deployed retirement URLs return 410, run:

```powershell
python scripts/retire-mobile-article.py --ssh u721646606 C:\Users\SALMAN\.ssh\rumiware_hostinger C:\Users\SALMAN\.ssh\rumiware_known_hosts
```

This operator tool streams repository-owned code over pinned SSH without
installing source or credentials on the server. It first invokes the existing
helper's `inspect` and `backup`, creating another fresh full-site backup. It then
reuses the existing recovery archive/snapshot verifier, requires the exact reviewed
410 configuration, and checks every retirement candidate before the first move.
Only the two allowlisted files with inspected checksums move into that new
backup's `retired-mobile-article/` directory. Nothing is deleted, no directory is
removed, and no other live file is changed. Changed files, symlinks, stale/corrupt
backups, extra targets or concurrent site changes stop the operation. A final
snapshot verifies every non-target file and directory unchanged.

Stop other publishers during this operation. As with existing recovery tooling,
filesystem checks detect races but do not lock out a human publisher. An interruption
can leave one target quarantined; the 410 rules remain active and both verified
full backups remain available. Do not repeat using an old backup or bypass checks.

## Verification and targeted recovery

Run `npm run build`, `npm run check`, `python scripts/test-hostinger.py` (now
including retirement safety fixtures), and `npm test`. `tests/blog-retirement.spec.cjs`
checks prose preservation, exact rule scope and 410 statuses, no old build/link/
sitemap entries, social metadata, poster geometry/loading, both URL mounts,
desktop/mobile, both themes and accessibility. Existing regressions remain active.
Browser tests mock forms and block external services where applicable.
Use a task-specific Playwright `--output` directory to preserve older local evidence.

After deployment and quarantine, verify public GET statuses for all four retired
URLs, both schemes and hostnames, and query variants, followed through any existing
HTTP-to-HTTPS upgrade. Final status must be 410, never an unrelated article.
Check both remaining articles, listing, sitemap, images and social metadata.

For recovery, stop other publishers and take a fresh verified full backup first.
Use the verified post-deployment/pre-quarantine archive to restore **only** the two
missing article files after validating their archive members, recorded checksums
and modes. Refuse to overwrite later files. Validate the current root config equals
the exact new hash above, then atomically restore **only** `.htaccess` from the
preparation backup, requiring the old hash above and preserving mode. Do not restore
the entire archive. An ordinary targeted `git revert` and normal push can then
publish the reverted source; restoring the baseline root config first allows the
existing conflict guard to accept that deployment. Never reset or force-push.
Retain all preparation, deployment and quarantine backups and record their actual
run identifiers in the release evidence. Later edits require separate review.
