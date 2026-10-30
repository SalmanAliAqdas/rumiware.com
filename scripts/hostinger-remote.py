"""Executed over pinned SSH by deploy-hostinger.py; requires Python >= 3.9."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import sys
import tarfile
import tempfile

TARGET = Path('/home/u721646606/domains/rumiware.com/public_html')
BACKUPS = TARGET.parent / '.deployment-backups'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def verify_target():
    require(TARGET.is_dir() and TARGET.resolve() == TARGET,
            'Destination missing or a path component is a symlink; stopping.')
    require(os.access(TARGET, os.R_OK | os.X_OK), 'Destination unreadable.')


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest() if hasattr(hashlib, 'file_digest') else hash_stream(stream)


def hash_stream(stream):
    value = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        value.update(chunk)
    return value.hexdigest()


def snapshot(root):
    result = {}
    for path in sorted(root.rglob('*')):
        mode = path.lstat().st_mode
        require(stat.S_ISREG(mode) or stat.S_ISDIR(mode),
                'Symlink or special file in destination; manual review required.')
        result[path.relative_to(root).as_posix()] = (
            ['directory', stat.S_IMODE(mode)] if path.is_dir() else
            ['file', stat.S_IMODE(mode), path.stat().st_size, digest(path)])
    return result


def safe_name(name):
    path = PurePosixPath(name)
    require(name and not path.is_absolute() and '\\' not in name and
            all(part not in ('', '.', '..') for part in name.split('/')),
            'Unsafe payload path.')
    forbidden = {'.git', '.github', 'node_modules', 'src', 'scripts', 'tests',
                 'reference', 'verification', '.vscode', '.aws', '.ssh', '.codex',
                 '.npmrc', '.netrc', 'credentials.json', 'id_rsa', 'id_ed25519'}
    require(not any(part in forbidden or part.startswith('.env') or
                    part.lower().endswith(('.pem', '.key')) for part in path.parts),
            'Source or credential path in payload.')
    return path


def protected(name):
    # Preserve all existing hidden hosting files/directories except the build marker.
    return (any(p.startswith('.') and p != '.nojekyll' for p in PurePosixPath(name).parts)
            or PurePosixPath(name).name.lower() in {'web.config', 'php.ini'})


def main():
    mode, run = sys.argv[1:]
    require(re.fullmatch(r'[0-9]+-[0-9]+', run), 'Invalid deployment identifier.')
    verify_target()
    if mode == 'inspect':
        snapshot(TARGET)
        require(os.access(TARGET, os.W_OK), 'Destination not writable.')
        require(os.access(TARGET.parent, os.W_OK), 'Backup parent not writable.')
        print('Read-only verification passed for exactly ' + str(TARGET))
        return

    require(mode in {'backup', 'deploy'}, 'Invalid operation.')
    require(not BACKUPS.is_symlink(), 'Backup root must not be a symlink.')
    if mode == 'backup':
        BACKUPS.mkdir(mode=0o700, exist_ok=True)
    require(BACKUPS.is_dir() and BACKUPS.resolve() == BACKUPS, 'Unsafe backup root.')
    folder = BACKUPS / run
    if mode == 'backup':
        folder.mkdir(mode=0o700)  # Exclusive: never reuse or overwrite a backup.
        before = snapshot(TARGET)
        archive = folder / 'site.tar'
        with tarfile.open(archive, 'x') as tar:
            tar.add(TARGET, arcname='.', recursive=True)
        # Read every archived byte and compare against the complete original tree.
        recovered = {}
        with tarfile.open(archive) as tar:
            for item in tar:
                if item.name == '.':
                    continue
                name = item.name.removeprefix('./')
                require(item.isdir() or item.isfile(), 'Unsupported backup member.')
                recovered[name] = (['directory', item.mode] if item.isdir() else
                                   ['file', item.mode, item.size, hash_stream(tar.extractfile(item))])
        require(recovered == before == snapshot(TARGET),
                'Backup verification failed or website changed during backup.')
        (folder / 'snapshot.json').write_text(json.dumps(before), encoding='utf-8')
        (folder / 'archive.sha256').write_text(digest(archive), encoding='ascii')
        print('Verified full backup (including dotfiles): ' + str(archive))
        return

    require(folder.is_dir() and folder.resolve() == folder, 'Missing verified backup.')
    before = json.loads((folder / 'snapshot.json').read_text(encoding='utf-8'))
    require(digest(folder / 'site.tar') == (folder / 'archive.sha256').read_text(),
            'Backup integrity check failed; stopping.')
    require(snapshot(TARGET) == before, 'Remote site changed after backup; stopping.')
    # Staging is outside public_html; no source files are transferred.
    stage = folder / 'incoming'
    stage.mkdir(mode=0o700)
    names = set()
    with tarfile.open(fileobj=sys.stdin.buffer, mode='r|') as tar:
        for item in tar:
            name = item.name
            safe_name(name)
            require(name not in names and (item.isfile() or item.isdir()),
                    'Duplicate, symlink, or special payload member.')
            names.add(name)
            path = stage / name
            if item.isdir():
                path.mkdir(parents=True, exist_ok=True)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(item) as source, path.open('xb') as output:
                    shutil.copyfileobj(source, output)
    require((stage / 'index.html').is_file(), 'Payload index.html missing.')
    # Resolve every conflict before writing anything to public_html.
    conflicts = []
    files = []
    for path in sorted(stage.rglob('*')):
        name = path.relative_to(stage).as_posix()
        dest = TARGET / name
        require(not dest.is_symlink(), 'Destination symlink conflict.')
        require(not dest.exists() or dest.is_dir() == path.is_dir(), 'File/directory conflict.')
        if path.is_file():
            if dest.exists() and protected(name):
                if digest(path) != digest(dest):
                    conflicts.append(name)
                continue  # Identical hosting configuration is preserved in place.
            files.append((path, dest))
    if conflicts:
        print('Hosting configuration conflicts: ' + json.dumps(conflicts))
        raise RuntimeError('No website files written. Resolve conflicts per docs/HOSTINGER.md.')
    verify_target()
    require(snapshot(TARGET) == before, 'Remote site changed while staging; stopping.')
    for path in sorted(stage.rglob('*')):
        if path.is_dir():
            dest = TARGET / path.relative_to(stage)
            if not dest.exists():
                dest.mkdir(mode=0o755)
                dest.chmod(0o755)  # Override the private backup/staging umask.
    # Activate new root routing only after its destination pages/assets exist.
    # All conflict, snapshot, backup and checksum guards remain unchanged.
    for source, dest in sorted(files, key=lambda pair: pair[1] == TARGET / '.htaccess'):
        # Atomic per file. The whole deployment is not a single atomic transaction.
        with tempfile.NamedTemporaryFile(dir=dest.parent, prefix='.deploy-', delete=False) as output:
            temp = Path(output.name)
            with source.open('rb') as stream:
                shutil.copyfileobj(stream, output)
        temp.chmod(stat.S_IMODE(dest.stat().st_mode) if dest.exists() else 0o644)
        os.replace(temp, dest)
    require(all(digest(source) == digest(dest) for source, dest in files),
            'Uploaded file verification failed; restore backup if needed.')
    print('Deployment verified; remote-only files and existing hosting configuration preserved.')


if __name__ == '__main__':
    os.umask(0o077)
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
