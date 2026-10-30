# Canonical www redirect and recovery

Baseline: `90201503a90443591eaaa2fb71304e27f797c8dc` (the completed Analytics update).
On 30 October 2026, pinned, read-only SSH confirmed the real root `.htaccess`
contained exactly the repository's managed clean-URL rules, with no other root
rules and no domain-parent `.htaccess`. HTTPS www served duplicate pages (200);
www legacy URLs redirected within www. HTTP www first redirected to HTTPS www.

Before publishing any configuration change, the unchanged baseline deployment
helper created and read-back verified this private full-site backup:

`/home/u721646606/domains/rumiware.com/.deployment-backups/1793357563-1/site.tar`

The accompanying `archive.sha256` and `snapshot.json` were verified, including
`.htaccess`, dotfiles and remote-only files. The baseline `.htaccess` SHA-256 is:

`8a51280002cd38ebe9f6cb4ff559d92a1bedc970a99eed99195ab1458d03d654`

The reviewed replacement SHA-256 is:

`3f341c8cc89e139026ed9e01db0126f79da6359cbb509085c093eae88fab5347`

## Rules and publishing

`scripts/routes.cjs` generates `config/clean-url-redirects.conf`; the existing
builder checks their equality and emits `dist/.htaccess`. Known legacy paths
keep their `THE_REQUEST` guards and 301/NE flags, with fixed canonical absolute
targets so www legacy requests reach their final non-www clean destination.
The fallback matches only `www.rumiware.com` (case-insensitively). It captures
the original encoded path from `THE_REQUEST`, rather than a decoded rule
backreference. The fixed HTTPS destination, NE flag, and inherited query preserve
encoding without double encoding. The rule never uses proxy scheme headers or
a supplied host in the target. Non-www requests cannot loop through this rule.
`ErrorDocument 404 /404.html` and existing DirectoryIndex guards remain intact.

The deployment helper admits only the above exact old-to-new checksum pair for
the root `.htaccess`. Other modified root configurations and every other hidden
hosting file still stop deployment before any public write. Identical existing
configuration stays in place. Every deployment still takes and verifies its own
full backup, rechecks the unchanged remote snapshot, and atomically activates
`.htaccess` only after ordinary uploads finish, with another checksum check just
before activation to catch configuration edits during upload. There is no force-overwrite mode,
remote deletion, credential change, or change to DNS, certificates, CDN settings,
page content or Analytics. The existing www certificate is retained.

## Verification boundary

Run `npm run build`, `npm run check`, `python scripts/test-hostinger.py`, and the
relevant Playwright specs (canonical-host, clean-urls, analytics, chatbot,
blog-navigation, plus form regressions). CI runs the complete browser suite.
Configuration fixtures model rules and safety checks; the local preview does
not execute Apache/LiteSpeed `.htaccess`.

After deployment, verify real status/Location headers for both schemes, clean
and legacy paths, nested pages, static assets, encoded paths and queries, and a
missing path followed through to a real 404. Check canonical URLs and browser
fragment inheritance separately. Existing Hostinger HTTP-to-HTTPS handling may
precede `.htaccess`, leaving an HTTP-www → HTTPS-www → HTTPS-non-www chain.
Report that chain rather than changing upstream HTTPS/security settings.
Intercept Analytics and mock form submissions during browser verification.
Hostinger may challenge automated browser requests; distinguish raw live HTTP
checks from browser checks using unchanged live responses relayed over HTTP.

## Targeted rollback

Do not use the older clean-URL migration quarantine tool to roll back this
update: the clean URLs and the subsequent Analytics release must remain.

Stop other publishers. Make a fresh verified full backup using the same pinned
SSH setup and the current deployment helper's `inspect`/`backup` operations.
Require the live `.htaccess` to match the reviewed replacement checksum above;
otherwise stop to preserve later edits. Validate the preparation archive checksum
and its `.htaccess` member against `snapshot.json` and the baseline checksum.
Extract only that member into a private temporary file, preserve the current
file mode, recheck the live checksum, then atomically replace only root
`.htaccess`. Verify the restored checksum. Do not restore the entire archive or
modify/delete remote-only files.

Then revert only `Redirect www traffic to canonical RumiWare domain` with an
ordinary `git revert` and push to `origin main`. Restoring the exact baseline
configuration first lets the baseline helper's original conflict guard accept
the revert deployment. Monitor it and recheck routing. Never reset/force-push or
revert the Analytics commit. Retain both preparation and deployment backups.
