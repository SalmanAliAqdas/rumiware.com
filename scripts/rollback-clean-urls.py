"""Quarantine only unchanged migration-created files AFTER git revert deployment.

Run over the same pinned SSH connection. Arguments: migration run, fresh backup run.
Both backups must already have been verified by the unchanged deployment helper.
"""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import stat
import subprocess
import sys
import tarfile
import time

TARGET = Path('/home/u721646606/domains/rumiware.com/public_html')
BACKUPS = TARGET.parent / '.deployment-backups'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()


def snapshot(root):
    result = {}
    for path in sorted(root.rglob('*')):
        mode = path.lstat().st_mode
        require(stat.S_ISREG(mode) or stat.S_ISDIR(mode), 'Symlink or special file; stop.')
        result[path.relative_to(root).as_posix()] = (
            ['directory', stat.S_IMODE(mode)] if path.is_dir() else
            ['file', stat.S_IMODE(mode), path.stat().st_size, digest(path)])
    return result


def backup(run):
    require(re.fullmatch(r'[0-9]+-[0-9]+', run), 'Invalid backup identifier.')
    folder = BACKUPS / run
    require(folder.is_dir() and folder.resolve() == folder, 'Unsafe or missing backup.')
    require(digest(folder / 'site.tar') == (folder / 'archive.sha256').read_text(), 'Backup checksum mismatch.')
    recorded = json.loads((folder / 'snapshot.json').read_text())
    recovered = {}
    with tarfile.open(folder / 'site.tar') as archive:
        for item in archive:
            if item.name == '.':
                continue
            require(item.isdir() or item.isfile(), 'Unsupported backup member.')
            name = item.name.removeprefix('./')
            if item.isdir():
                recovered[name] = ['directory', item.mode]
            else:
                value = hashlib.sha256()
                with archive.extractfile(item) as stream:
                    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                        value.update(chunk)
                recovered[name] = ['file', item.mode, item.size, value.hexdigest()]
    require(recovered == recorded, 'Backup archive and snapshot differ.')
    return folder, recorded


def operate_over_ssh():
    # Local convenience mode. SSH alone reads the existing private key.
    user, key_path, known_path, migration_run = sys.argv[2:]
    require(re.fullmatch(r'[A-Za-z_][A-Za-z0-9_-]*', user), 'Invalid confirmed SSH username.')
    require(re.fullmatch(r'[0-9]+-[0-9]+', migration_run), 'Invalid migration identifier.')
    require(Path(key_path).is_file() and Path(known_path).is_file(), 'Existing key or trusted hosts file missing.')
    entries = [line.split()[0] for line in Path(known_path).read_text().splitlines()
               if line.strip() and not line.startswith('#')]
    require(len(entries) == 1, 'Specify an unambiguous trusted host entry; do not guess.')
    endpoint = re.fullmatch(r'\[([A-Za-z0-9.-]+)\]:([0-9]+)', entries[0])
    require(endpoint and 1 <= int(endpoint[2]) <= 65535, 'Trusted endpoint must explicitly include port.')
    null = 'NUL' if os.name == 'nt' else '/dev/null'
    ssh = ['ssh', '-F', null, '-T', '-p', endpoint[2], '-i', key_path,
           '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + known_path,
           '-o', 'GlobalKnownHostsFile=' + null, '-o', 'UpdateHostKeys=no',
           '-o', 'PasswordAuthentication=no', '-o', 'KbdInteractiveAuthentication=no',
           '-o', 'ConnectTimeout=20', '-o', 'ServerAliveInterval=15',
           '-o', 'ServerAliveCountMax=3', user + '@' + endpoint[1]]
    def execute(code, *arguments):
        result = subprocess.run(ssh + [shlex.join(['python3', '-c', code, *arguments])], capture_output=True, text=True)
        require(result.returncode == 0, 'Pinned SSH recovery stopped: ' + result.stderr.strip())
        print(result.stdout, end='')
    helper = (Path.cwd() / 'scripts/hostinger-remote.py').read_text(encoding='utf-8')
    current_run = str(int(time.time())) + '-1'
    execute(helper, 'inspect', current_run)
    execute(helper, 'backup', current_run)
    execute(Path(__file__).read_text(encoding='utf-8-sig'), migration_run, current_run)


def main():
    migration_run, current_run = sys.argv[1:]
    require(migration_run != current_run, 'Use a fresh backup of the post-revert site.')
    require(TARGET.is_dir() and TARGET.resolve() == TARGET, 'Unsafe target.')
    require(BACKUPS.is_dir() and BACKUPS.resolve() == BACKUPS, 'Unsafe backup root.')
    migration, before = backup(migration_run)
    current, preserved = backup(current_run)
    require('.htaccess' not in before, 'This migration expected no previous .htaccess; manual review required.')
    require(snapshot(TARGET) == preserved, 'Site changed after recovery backup; stop.')
    incoming = migration / 'incoming'
    require(incoming.is_dir() and incoming.resolve() == incoming, 'Migration payload missing.')
    expected = snapshot(incoming)
    require('.htaccess' in expected and expected['.htaccess'][0] == 'file', 'Migration redirect file missing.')
    created = {name: item for name, item in expected.items() if name not in before}
    files = []
    directories = []
    for name, item in created.items():
        relative = PurePosixPath(name)
        require(not relative.is_absolute() and all(p not in ('.', '..') for p in relative.parts), 'Unsafe payload path.')
        dest = TARGET / name
        require(dest.resolve().is_relative_to(TARGET), 'Cleanup escaped public_html.')
        if not dest.exists():
            continue
        require(not dest.is_symlink(), 'Symlink conflict; stop.')
        if item[0] == 'file':
            require(dest.is_file() and digest(dest) == item[3], 'Migration-created file changed; preserve it: ' + name)
            files.append((name, dest))
        else:
            require(dest.is_dir(), 'Directory conflict; stop.')
            directories.append(dest)
    # Preflight all files before the first move. No pre-existing path is removed.
    quarantine = current / 'clean-url-quarantine'
    quarantine.mkdir(mode=0o700)
    require(quarantine.resolve() == quarantine, 'Unsafe quarantine.')
    require(snapshot(TARGET) == preserved, 'Site changed during recovery preflight; stop.')
    for name, source in sorted(files):
        destination = quarantine / name
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.replace(source, destination)
    for directory in sorted(directories, key=lambda p: len(p.parts), reverse=True):
        # Empty migration-created directories only; later/unrelated files remain.
        if not any(directory.iterdir()):
            directory.rmdir()
    require(not (TARGET / '.htaccess').exists(), 'Redirect configuration was not removed.')
    print('Migration-created unchanged files quarantined in ' + str(quarantine))
    print('Pre-existing pages, hosting content and backups preserved. Verify live .html URLs.')


if __name__ == '__main__':
    os.umask(0o077)
    try:
        if len(sys.argv) > 1 and sys.argv[1] == '--ssh':
            operate_over_ssh()
        else:
            main()
    except Exception as error:
        print('Clean URL recovery stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
