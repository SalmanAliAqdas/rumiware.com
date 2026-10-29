# Hostinger deployment

The **Deploy static website to Hostinger** workflow automatically builds, checks,
backs up, and deploys the website on every push to `main`. Manual deployment is
also available through **Actions > Deploy static website to Hostinger > Run workflow**
on the trusted branch you intend to release. Both triggers perform a real
deployment with the same checks and safeguards. Pull requests and pushes to other
branches do not trigger automatic Hostinger deployment. The existing GitHub Pages
push deployment remains separate and unchanged.

## Requirements and trust

- Node.js 24 matches the README and existing CI. The workflow uses `npm ci`,
  `npm run build`, `npm run check` (including HTML validation), and the existing
  Playwright suite with Chromium. `npm test` also rebuilds via `pretest`.
- The six `HOSTINGER_*` secrets listed below must exist. They are scoped to the
  deployment step, never interpolated into shell source or printed. SSH key and
  known-hosts files exist only in a private runner temporary directory, outside
  the checkout, with permissions 0600; normal/error exits remove them. Nothing
  containing credentials is uploaded as an artifact. Abrupt runner termination
  relies on GitHub's ephemeral hosted runner disposal.
- `HOSTINGER_SSH_KEY`: dedicated unencrypted deployment key authorized on Hostinger.
  Passwords, interactive key passphrases, and keyboard-interactive login are disabled.
- `HOSTINGER_HOST`, `HOSTINGER_PORT`, `HOSTINGER_USERNAME`: actual SSH endpoint.
- `HOSTINGER_TARGET_DIR` must be exactly
  `/home/u721646606/domains/rumiware.com/public_html`, with no trailing slash.
  The secret is checked locally. The remote helper independently hardcodes and
  checks that same path, rejecting symlink components and missing directories.
- `HOSTINGER_KNOWN_HOSTS`: independently verified OpenSSH known-hosts entries for
  the endpoint. Nonstandard ports normally require `[hostname]:port` entries.
  Verify fingerprints through a trusted Hostinger/account channel. An absent or
  changed key stops SSH. The workflow uses `StrictHostKeyChecking=yes`, only this
  known-hosts file, no automatic key updates, and no `ssh-keyscan` trust bootstrap.
- Hostinger must provide shell SSH and Python 3.9+ with its standard library;
  SFTP-only access is insufficient. No remote npm, rsync, sudo, or third-party
  deployment action is required. The first connection tests these prerequisites
  without writing remote files.
- The SSH account must read the entire site and write the destination and its
  domain parent. Backups require disk space for the full old site, the incoming
  build, and temporary replacement files. Restrict account/key privileges as
  supported by the host. Review changes before merging or pushing to `main`, and
  review the selected branch before manual dispatch: repository workflow code has
  access to deployment secrets.

## Safety sequence

1. Build and run all existing release checks before using SSH secrets. Confirm
   `dist/index.html`; reject symlinks, special files, source directories, credential
   filenames, and traversal paths in the payload.
2. Connect read-only and verify the exact real destination, file types, and access.
   No destination is created automatically. Symlinks or special files anywhere in
   the existing tree require manual review and stop deployment.
3. Create a private, exclusive backup directory outside the web root:
   `/home/u721646606/domains/rumiware.com/.deployment-backups/RUN_ID-RUN_ATTEMPT/`.
   `site.tar` contains the entire current site, including `.htaccess`, other
   dotfiles, and hidden directories. Read every archive member back and compare
   its content, mode, size, and complete file list with the original site.
   A changed site or any backup error stops before upload. Save a SHA-256 checksum
   and tree snapshot alongside it. No backup is overwritten or automatically pruned.
4. Recheck backup integrity and the unchanged remote tree. Stream only the
   contents of `dist/`, including `.nojekyll` and any other validated dotfiles,
   into private staging beside the backup. Helpers run over SSH without being
   installed into the website; repository source is not a website payload.
5. Check all destination conflicts before changing public files. Preserve every
   existing hidden path except `.nojekyll`, plus `web.config` and `php.ini`.
   Identical configuration files are left untouched. Different contents abort
   with a list of conflicting relative paths and no website writes. File/directory
   collisions also stop. Remote-only files are retained; no remote deletion is used.
6. Recheck the destination and snapshot, then replace ordinary build files
   atomically per file. Verify SHA-256 contents afterward. New public directories
   receive 0755 and new public files 0644; existing file modes are retained.

GitHub concurrency serializes this repository's Hostinger workflow runs; running
deployments are not cancelled by newer pushes or manual dispatches. The group
deliberately does not vary by branch. GitHub may replace an older pending run with a newer one.
This does not lock out a human SFTP session or another repository: suspend other
writers during deployment. Snapshot checks detect changes before publishing but
cannot eliminate races during the final file replacements.

## Resolving hosting configuration conflicts

Read the failed run's conflict paths and compare the staged build with the live
configuration using your trusted hosting tools. Never paste private configuration
or credentials into workflow logs or issues. Keep the live hosting configuration
by removing the conflicting file from the build, or reconcile the intended change
manually after review and a backup. The current builder emits `.nojekyll` but no
`.htaccess`. Do not bypass the guard to force an overwrite. A subsequent workflow run
creates a fresh full backup and repeats every check.

No step changes DNS, SSL, email, other domains, or account-wide settings. Website
configuration can affect those features indirectly, which is why existing
configuration is preserved.

## Restore a backup

Restore is an explicit operator action, never automatically triggered by a failed
workflow. Stop other publishers and use the same independently verified SSH host
identity. In the Hostinger SSH shell, replace only `123456789-1` below with the
verified run ID/attempt printed in the deployment log:

```bash
set -eu
target=/home/u721646606/domains/rumiware.com/public_html
backup=/home/u721646606/domains/rumiware.com/.deployment-backups/123456789-1
test -d "$target"
test "$(realpath "$target")" = "$target"
test "$(realpath "$backup")" = "$backup"
cd "$backup"
printf '%s  site.tar\n' "$(cat archive.sha256)" | sha256sum --check --status
tar -tf site.tar >/dev/null
# Preserve the failed/current state, including hidden files, before restoring.
# noclobber prevents accidentally replacing a previous recovery archive.
(set -C; tar -C "$target" -cpf - . > before-restore.tar)
tar -C "$target" -xpf site.tar
```

Check every command's success. This restores archived content and permissions,
including hosting configuration, over the current site; new files introduced by
the failed deployment remain. Exact rollback requires reviewing those extra
paths against `snapshot.json` and separately deciding how to remove or quarantine
them. No automated deletion is supplied. Do not replace or rename `public_html`
without confirming Hostinger's document-root behavior. Verify the homepage,
assets, redirects, and forms after recovery; retain backups privately until you
choose a retention policy. Archives contain hosting configuration and must never
be placed under `public_html` or published as GitHub artifacts.

## Verification and limits

The deployment logic has a local fixture test:
`python scripts/test-hostinger.py`. It runs the actual remote helper against
temporary directories, without SSH or credentials. Workflow structure can be
checked with `actionlint .github/workflows/hostinger.yml`.

The first manual deployment succeeded and the site was confirmed live by the
site owner before automatic deployment was enabled. Every new automatic or manual
run still verifies SSH access, backup integrity, the destination, and conflicts;
a previous success does not establish that a later deployment will succeed.
Publishing is atomic per file, not across the entire site: interruption can leave
a mixed version requiring recovery. Retained remote-only files can serve stale
content. No live HTTP, inbox delivery, DNS, or TLS verification is implied by the
filesystem checksum check. Existing browser tests mock form submissions.
Existing `index.php` files or `DirectoryIndex` rules may take precedence over the
uploaded `index.html`; review live routing separately without automatic deletion
or overwriting `.htaccess`.

Local preparation on 2026-10-29 verified `npm ci`, the 20-page build and static
checks, all 61 browser tests, all nine deployment safety fixtures, Python syntax,
workflow safety assertions, and actionlint 1.7.12. These local checks used Node.js 26.7.0; the
workflow selects the repository's required Node.js 24. This local validation did
not verify production behavior; deployment results must be checked in the
GitHub Actions run for the corresponding commit.
