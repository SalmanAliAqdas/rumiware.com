"""Quarantine only the two inspected retired article files after deployment.

Uses the existing pinned SSH, full-backup helper and archive/snapshot verifier.
No public configuration is edited and no file is deleted.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import time

EXPECTED_CONFIG = 'a2db54ab781fb142fa9d23110b5d031e375a84c8289b0d3ce277d3c330fd3bd7'
FILES = {'blog-post.html', 'blog/fast-mobile-website/index.html'}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(path):
    value = hashlib.sha256()
    with path.open('rb') as stream:
        for part in iter(lambda: stream.read(1024 * 1024), b''):
            value.update(part)
    return value.hexdigest()


def retire(recovery, run, manifest):
    target = recovery['TARGET']
    require(target.is_dir() and target.resolve() == target, 'Unsafe document root.')
    require(set(manifest['retiredFiles']) == FILES, 'Retirement allowlist differs; stop.')
    require(all(re.fullmatch('[a-f0-9]{64}', h) for h in manifest['retiredFiles'].values()), 'Invalid reviewed checksum.')
    folder, before = recovery['backup'](run)  # Checks archive bytes and every member against snapshot.
    snapshot = recovery['snapshot']
    require(snapshot(target) == before, 'Website changed after backup; stop.')
    require(before.get('.htaccess', [None, None, None, None])[3] == EXPECTED_CONFIG,
            'Reviewed 410 configuration is not active; stop.')
    candidates = []
    for name, expected in manifest['retiredFiles'].items():
        source = target / name
        if name not in before:
            require(not source.exists(), 'Unrecorded article file; stop.')
            continue
        require(source.resolve().is_relative_to(target) and not source.is_symlink(), 'Unsafe article path.')
        require(before[name][0] == 'file' and before[name][3] == expected and digest(source) == expected,
                'Article file changed; preserve it: ' + name)
        candidates.append((name, source, expected))
    if not candidates:
        print('Retired article files already absent; verified backup retained: ' + str(folder))
        return
    # Complete every preflight before the first move; never overwrite a quarantine.
    quarantine = folder / 'retired-mobile-article'
    require(not quarantine.exists() and not quarantine.is_symlink(), 'Quarantine already exists; stop.')
    require(snapshot(target) == before, 'Website changed during retirement preflight; stop.')
    quarantine.mkdir(mode=0o700)
    for name, source, expected in candidates:
        require(source.is_file() and not source.is_symlink() and digest(source) == expected,
                'Article changed before move; stop: ' + name)
        destination = quarantine / name
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.replace(source, destination)
        require(not source.exists() and digest(destination) == expected, 'Quarantine verification failed.')
    expected_after = {name: item for name, item in before.items() if name not in {n for n, _, _ in candidates}}
    require(snapshot(target) == expected_after, 'Unexpected website change; inspect verified backup.')
    print('Only inspected article files quarantined in ' + str(quarantine))
    print('All other files, directories and hosting configuration verified unchanged.')


def operate_over_ssh():
    require(len(sys.argv) == 5 and sys.argv[1] in ('--ssh', '--backup-ssh'),
            'Usage: --ssh (or --backup-ssh) USER KEY_PATH KNOWN_HOSTS_PATH')
    mode, user, key_path, known_path = sys.argv[1:]
    require(re.fullmatch('[A-Za-z_][A-Za-z0-9_-]*', user), 'Invalid confirmed username.')
    require(Path(key_path).is_file() and Path(known_path).is_file(), 'Existing key or pinned hosts missing.')
    hosts = [line.split()[0] for line in Path(known_path).read_text().splitlines()
             if line.strip() and not line.startswith('#')]
    require(len(hosts) == 1, 'Require one unambiguous pinned host entry.')
    endpoint = re.fullmatch(r'\[([A-Za-z0-9.-]+)\]:([0-9]+)', hosts[0])
    require(endpoint and 1 <= int(endpoint[2]) <= 65535, 'Require the explicit trusted host and port.')
    null = 'NUL' if os.name == 'nt' else '/dev/null'
    ssh = ['ssh', '-F', null, '-T', '-p', endpoint[2], '-i', key_path,
           '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
           '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + known_path,
           '-o', 'GlobalKnownHostsFile=' + null, '-o', 'UpdateHostKeys=no',
           '-o', 'PasswordAuthentication=no', '-o', 'KbdInteractiveAuthentication=no',
           '-o', 'ConnectTimeout=20', '-o', 'ServerAliveInterval=15',
           '-o', 'ServerAliveCountMax=3', user + '@' + endpoint[1]]
    root = Path(__file__).resolve().parent.parent
    helper = (root / 'scripts/hostinger-remote.py').read_text(encoding='utf-8')
    run = str(int(time.time())) + '-1'
    def execute(code, *arguments):
        command = shlex.join(['python3', '-', *arguments])
        result = subprocess.run(ssh + [command], input=code.encode('utf-8'), capture_output=True)
        require(result.returncode == 0, 'Pinned SSH operation stopped: ' + result.stderr.decode(errors='replace').strip())
        print(result.stdout.decode('utf-8'), end='')
    execute(helper, 'inspect', run)
    execute(helper, 'backup', run)
    if mode == '--backup-ssh':
        return
    recovery = (root / 'scripts/rollback-clean-urls.py').read_text(encoding='utf-8')
    manifest = json.loads((root / 'config/mobile-article-retirement.json').read_text(encoding='utf-8'))
    code = Path(__file__).read_text(encoding='utf-8')
    # Repository-owned code streams over stdin; no source or credentials installed remotely.
    bootstrap = ('import json, os\nos.umask(0o077)\n'
                 'recovery={"__name__":"retirement_recovery"}\nexec(' + repr(recovery) + ',recovery)\n'
                 'retirement={"__name__":"retirement_operation"}\nexec(' + repr(code) + ',retirement)\n'
                 'retirement["retire"](recovery,' + repr(run) + ',' + repr(manifest) + ')\n')
    execute(bootstrap)


if __name__ == '__main__':
    try:
        operate_over_ssh()
    except Exception as error:
        print('Article retirement stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
