# Clean URL migration and recovery

## Baseline and real hosting inspection

Previous working/deployed commit: `1b35fe8509f432b3b1545dfe8de2b685b05f42b4`, verified by successful Hostinger run `40986352014`. The working tree was clean before this separate update.

On 30 October 2026, read-only SSH using the existing key, confirmed login and pinned host entry verified the real target `/home/u721646606/domains/rumiware.com/public_html`. Neither that directory nor its domain parent contained `.htaccess`. Their absence was recorded; no existing rules were replaced. Keys, credentials, DNS, certificates, hosting plans and workflow settings remain unchanged.

Before any redirect configuration change, the unchanged deployment helper created and verified this private full-site backup:

`/home/u721646606/domains/rumiware.com/.deployment-backups/1793325662-1/`

It contains `site.tar`, `archive.sha256` and `snapshot.json`, including dotfiles, legacy pages, remote-only files and the absence of `.htaccess`. Every archived member/hash/size/mode matched an unchanged site snapshot. Retain this directory outside `public_html`.

The automatic migration deployment independently creates its normal backup at `.deployment-backups/RUN_ID-RUN_ATTEMPT/`, retaining its release under `incoming/`. The migration run is `40991512982-1`: its verified backup is `/home/u721646606/domains/rumiware.com/.deployment-backups/40991512982-1/site.tar`. Use this baseline run for recovery, not the preparation-only backup.

## URL inventory

`src/data/routes.json` is authoritative. Source page IDs stay stable; public routes are independent.

| Old URL | Canonical URL |
| --- | --- |
| `/index.html` | `/` |
| `/about.html` | `/about/` |
| `/services.html` | `/services/` |
| `/portfolio.html` | `/portfolio/` |
| `/pricing.html` | `/pricing/` |
| `/team.html` | `/team/` |
| `/blog.html` | `/blog/` |
| `/contact.html` | `/contact/` |
| `/get-quote.html` | `/get-quote/` |
| `/ai-solutions.html` | `/ai-solutions/` |
| `/careers.html` | `/careers/` |
| `/faq.html` | `/faq/` |
| `/full-stack.html` | `/full-stack/` |
| `/mobile-apps.html` | `/mobile-apps/` |
| `/privacy.html` | `/privacy/` |
| `/process.html` | `/process/` |
| `/terms.html` | `/terms/` |
| `/web-development.html` | `/web-development/` |
| `/blog-post.html` | `/blog/fast-mobile-website/` |
| `/blog/future-of-ai/index.html` | `/blog/future-of-ai/` (existing clean article preserved) |

`404.html` remains a noindex error document with no canonical/sitemap entry. Assets, `robots.txt` and `sitemap.xml` retain their extensions. External `<route>/index.html` requests redirect to the directory; production DirectorySlash handles omitted trailing slashes.

## Build and hosting changes

`scripts/routes.cjs` validates route coverage and supplies output paths, link conversion and explicit redirects. Pages build to `<route>/index.html`, except home and the error document. Source HTML links, chatbot links, owned article references and structured data use clean URLs. The builder also converts generated links and prefixes navigation, assets and responsive `srcset` paths for nested pages and the `/rumiware.com/` preview mount. Article dates/authors, page content, layout, themes, forms, package queries, fragments and external project URLs are preserved.

`config/clean-url-hosting-review.json` records the inspected absence and verified backup. `config/clean-url-redirects.conf` must exactly match the route-generated rules; the builder copies it to `dist/.htaccess`. Configuration source/review files and docs are not copied into public directories.

The new file contains only marked migration redirects and `ErrorDocument 404 /404.html`, prepared after real inspection established that no `.htaccess` existed. The deployment helper still rejects any different existing hosting configuration before public writes, preserving identical configuration in place. Strict host verification, secret handling, backup validation, snapshot checks, path/type checks and remote-only preservation remain intact. The only publishing adjustment activates a new root `.htaccess` after ordinary pages/assets have finished uploading; a fixture verifies that an earlier upload failure cannot activate its redirects.

Known-path rules use `R=301,L,NE` and `THE_REQUEST` guards. Queries remain because targets supply no replacement query. Guards distinguish external requests from internal DirectoryIndex resolution to avoid loops. Unknown `.html` paths have no generic redirect. See Apache's [per-directory rewrite documentation](https://httpd.apache.org/docs/2.4/en/rewrite/htaccess.html) and [rewrite flags](https://httpd.apache.org/docs/2.4/rewrite/flags.html).

GitHub Pages serves the same canonical directories/relative assets at its repository mount. It does not execute `.htaccess`; legacy server-side 301s are a Hostinger feature, not JavaScript redirect pages.

## Verification boundary

Run `npm run build`, `npm run check`, `npm test` and `python scripts/test-hostinger.py` (`npm.cmd` here). Existing behavioural tests retain layout, keyboard, accessibility, forms, quote/package, theme, portfolio, article and chatbot coverage with updated destinations. New route tests cover every canonical page/refresh/navigation, SEO/sitemap, local redirect/query/fragment behaviour, unknown 404s and constrained Apache rules.

The preview server models redirects; it and the regex fixture do not execute `.htaccess`. Apache/LiteSpeed was unavailable locally. Verify production separately with real HTTP status/Location/query/single-hop checks, unknown 404s and browser fragments. Hostinger CDN challenges may require normal browser completion before browser-context requests. Never weaken hosting protections for verification.

## Live cache finding and narrow follow-up

All 80 real HTTP route/status/Location/query checks passed after migration. Live browser verification exposed an older CDN-cached bare `script.js` (8,136 bytes) instead of the current 18,269-byte LF-normalized script. The existing versioned references on portfolio/team/articles worked. The follow-up commit `Version shared assets across clean URL pages` extends that existing content-version query to every normal public page; extensions and asset contents are unchanged. The 404 recovery page keeps its bare references. No CDN settings, credentials or security rules were changed.

Because the migration was already pushed and force-pushing is forbidden, the fix is a separate small commit. Recovery must revert that companion first and use its retained final release payload hashes for new route files, while using the original migration snapshot to determine which paths were actually created.

## Targeted rollback

Stop other publishers. Revert only this migration and its cache companion, preserving later commits. Do not reset, force-push, delete `public_html`, use broad deletion or restore the entire old archive over later work.

Save the recovery tool before reverting (PowerShell, from the repository):

```powershell
$migrationCommit = git log main -1 --format=%H --grep='^Migrate website pages to clean URLs with legacy redirects$'
$assetFixCommit = git log main -1 --format=%H --grep='^Version shared assets across clean URL pages$'
if (-not $migrationCommit -or -not $assetFixCommit) { throw 'Migration/follow-up commit not found' }
New-Item -ItemType Directory -Path test-results -Force | Out-Null
git show "${assetFixCommit}:scripts/rollback-clean-urls.py" | Set-Content -Encoding utf8 test-results/rollback-clean-urls.py
git revert --no-commit $assetFixCommit $migrationCommit
if ($LASTEXITCODE -ne 0) { throw 'Resolve only these revert conflicts without discarding later work' }
git commit -m 'Revert clean URL migration and asset cache follow-up'
git push origin main
```

Confirm the revert's Hostinger deployment succeeds. This restores working `.html` pages/navigation but intentionally preserves remote-only clean directories and the migration `.htaccess`. Git revert alone is therefore insufficient.

The original migration baseline run is `40991512982-1`. Get the **asset-fix follow-up** deployment run ID/attempt from its successful workflow/release report, not the revert run. Replace the final `FINAL_RELEASE_RUN_ID-RUN_ATTEMPT` label below with that actual identifier. The tool checks baseline absence against the original migration snapshot, and compares current new-route bytes against the final follow-up payload. Do not use preparation backup `1793325662-1`, which has no `incoming/` release payload.

```powershell
python test-results/rollback-clean-urls.py --ssh u721646606 C:\Users\SALMAN\.ssh\rumiware_hostinger C:\Users\SALMAN\.ssh\rumiware_known_hosts 40991512982-1 FINAL_RELEASE_RUN_ID-RUN_ATTEMPT
```

The tool gets the endpoint/port only from the supplied trusted entry, uses the existing key without copying it, enforces strict host verification and disables password login. It first invokes the existing helper's inspection and creates a fresh verified full backup outside `public_html`. It verifies backup checksums, archive membership/content against snapshots, the unchanged current tree and new-file hashes against the retained final release before moving anything.

Only files matching the retained final release and absent from the migration's original snapshot move to the fresh backup's `clean-url-quarantine/`. Removing the migration-created `.htaccess` restores its original absence and inherited rules. Only empty migration-created directories are removed. Pre-existing directories, old pages, hosting files and later/unrelated files remain. Changed migration files, symlinks, corrupted backups or concurrent changes stop the whole preflight before cleanup; resolve those individually without bypassing guards.

Verify the homepage, `.html` URLs, article, forms, assets and status codes afterward. Retain all backups and quarantine. Recovery is explicit; normal deployment does not execute cleanup.

## Subsequent canonical-host update

[WWW-REDIRECT.md](WWW-REDIRECT.md) records the later www-to-non-www update, its
separate verified backup, checksum-scoped deployment exception and targeted
rollback. The original absence/backup records above remain historical facts.
Use that targeted rollback for only the www update; preserve clean URLs and the
Analytics release.
