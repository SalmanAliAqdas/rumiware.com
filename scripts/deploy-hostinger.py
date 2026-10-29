"""GitHub runner entry point. Never prints credentials or connects on import."""
import os
from pathlib import Path
import re
import shlex
import subprocess
import tarfile
import tempfile

from importlib.util import module_from_spec, spec_from_file_location

ROOT = Path(__file__).resolve().parent.parent
spec = spec_from_file_location('hostinger_remote', ROOT / 'scripts/hostinger-remote.py')
remote = module_from_spec(spec)
spec.loader.exec_module(remote)


def main():
    values = {name: os.environ.get('HOSTINGER_' + name, '') for name in
              ['SSH_KEY', 'HOST', 'PORT', 'USERNAME', 'TARGET_DIR', 'KNOWN_HOSTS']}
    remote.require(all(values.values()), 'A required Hostinger secret is missing.')
    remote.require(values['TARGET_DIR'] == remote.TARGET.as_posix(), 'Target secret must match the exact approved path.')
    remote.require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.-]*', values['HOST']), 'Invalid SSH host.')
    remote.require(re.fullmatch(r'[A-Za-z_][A-Za-z0-9_-]*', values['USERNAME']), 'Invalid SSH username.')
    remote.require(values['PORT'].isdigit() and 1 <= int(values['PORT']) <= 65535, 'Invalid SSH port.')
    run = os.environ.get('GITHUB_RUN_ID', '') + '-' + os.environ.get('GITHUB_RUN_ATTEMPT', '')
    remote.require(re.fullmatch(r'[0-9]+-[0-9]+', run), 'GitHub run identifier missing.')
    dist = ROOT / 'dist'
    remote.require(dist.is_dir() and not dist.is_symlink() and (dist / 'index.html').is_file(),
                   'Build dist/ with index.html before deployment.')
    payload = []
    for path in sorted(dist.rglob('*')):
        remote.safe_name(path.relative_to(dist).as_posix())
        remote.require(not path.is_symlink() and (path.is_dir() or path.is_file()), 'Unsafe dist entry.')
        payload.append(path)
    # Temporary credentials live outside the checkout and are removed even on error.
    with tempfile.TemporaryDirectory(prefix='hostinger-', dir=os.environ.get('RUNNER_TEMP')) as temp:
        temp = Path(temp)
        temp.chmod(0o700)
        key, known = temp / 'identity', temp / 'known_hosts'
        key.write_text(values['SSH_KEY'].replace('\r\n', '\n').rstrip() + '\n')
        known.write_text(values['KNOWN_HOSTS'].replace('\r\n', '\n').rstrip() + '\n')
        key.chmod(0o600)
        known.chmod(0o600)
        archive = temp / 'dist.tar'
        with tarfile.open(archive, 'w') as tar:
            for path in payload:
                tar.add(path, arcname=path.relative_to(dist).as_posix(), recursive=False)
        ssh = ['ssh', '-F', '/dev/null', '-T', '-p', values['PORT'], '-i', str(key),
               '-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes',
               '-o', 'StrictHostKeyChecking=yes', '-o', 'UserKnownHostsFile=' + str(known),
               '-o', 'GlobalKnownHostsFile=/dev/null', '-o', 'UpdateHostKeys=no',
               '-o', 'PasswordAuthentication=no', '-o', 'KbdInteractiveAuthentication=no',
               '-o', 'ConnectTimeout=20', '-o', 'ServerAliveInterval=15',
               '-o', 'ServerAliveCountMax=3', '-o', 'LogLevel=ERROR',
               values['USERNAME'] + '@' + values['HOST']]
        code = (ROOT / 'scripts/hostinger-remote.py').read_text(encoding='utf-8')
        def connect(mode, stream=None):
            command = shlex.join(['python3', '-c', code, mode, run])
            subprocess.run(ssh + [command], stdin=stream or subprocess.DEVNULL, check=True)
        connect('inspect')  # First connection performs no remote writes.
        connect('backup')   # Any failure prevents the upload connection.
        with archive.open('rb') as stream:
            connect('deploy', stream)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        print('Hostinger deployment stopped: ' + str(error))
        raise SystemExit(1)
    except Exception:
        # Do not echo subprocess arguments: they contain connection settings.
        print('Hostinger deployment stopped. Review the preceding safety error; backup retained.')
        raise SystemExit(1)
