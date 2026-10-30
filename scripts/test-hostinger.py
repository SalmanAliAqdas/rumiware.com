"""Local safety fixtures: never contacts SSH or uses deployment secrets."""
import io
import importlib.util
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

CODE = Path(__file__).with_name('hostinger-remote.py').read_text(encoding='utf-8')


class DeploymentSafety(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.target = self.root / 'public_html'
        self.target.mkdir()
        (self.target / 'index.html').write_text('old website')
        (self.target / '.htaccess').write_text('hosting configuration')
        (self.target / '.hidden').mkdir()
        (self.target / '.hidden/settings').write_text('private settings')
        (self.target / 'remote-only.txt').write_text('keep this')
        self.code = CODE.replace("Path('/home/u721646606/domains/rumiware.com/public_html')",
                                 'Path(' + repr(str(self.target.resolve())) + ')')
        self.backup = self.root / '.deployment-backups/123-1'
        self.run_id = '123-1'

    def call(self, mode, payload=b'', success=True):
        result = subprocess.run([sys.executable, '-c', self.code, mode, self.run_id],
                                input=payload, capture_output=True)
        self.assertEqual(result.returncode == 0, success,
                         result.stdout.decode() + result.stderr.decode())
        return result

    def payload(self, files=None):
        output = io.BytesIO()
        with tarfile.open(fileobj=output, mode='w') as tar:
            for name, content in (files or {'index.html': 'new website', '.nojekyll': '',
                                          'assets/file.css': 'body {}'}).items():
                info = tarfile.TarInfo(name)
                data = content.encode()
                info.size = len(data)
                tar.addfile(info, io.BytesIO(data))
        return output.getvalue()

    def test_inspection_is_read_only(self):
        self.call('inspect')
        self.assertFalse((self.root / '.deployment-backups').exists())
        self.assertEqual((self.target / 'index.html').read_text(), 'old website')

    def test_backup_and_publish_preserve_hidden_and_remote_only_files(self):
        self.call('backup')
        with tarfile.open(self.backup / 'site.tar') as archive:
            self.assertIn('./.htaccess', archive.getnames())
            self.assertIn('./.hidden/settings', archive.getnames())
        self.call('deploy', self.payload())
        self.assertEqual((self.target / 'index.html').read_text(), 'new website')
        self.assertTrue((self.target / '.nojekyll').is_file())
        self.assertEqual((self.target / '.htaccess').read_text(), 'hosting configuration')
        self.assertTrue((self.target / 'remote-only.txt').is_file())
        self.assertEqual((self.target / 'assets/file.css').read_text(), 'body {}')
        if sys.platform != 'win32':
            self.assertEqual((self.target / 'assets').stat().st_mode & 0o777, 0o755)

    def test_config_conflict_aborts_before_any_public_write(self):
        self.call('backup')
        result = self.call('deploy', self.payload({'index.html': 'new', '.htaccess': 'conflict'}), False)
        self.assertIn(b'.htaccess', result.stdout)
        self.assertEqual((self.target / 'index.html').read_text(), 'old website')
        self.assertEqual((self.target / '.htaccess').read_text(), 'hosting configuration')

    def test_identical_config_is_allowed_and_preserved(self):
        self.call('backup')
        self.call('deploy', self.payload({'index.html': 'new', '.htaccess': 'hosting configuration'}))
        self.assertEqual((self.target / 'index.html').read_text(), 'new')

    def test_reviewed_new_config_and_nested_routes_preserve_legacy_and_remote_only_files(self):
        (self.target / '.htaccess').unlink()  # Mirrors the inspected production state.
        (self.target / 'about.html').write_text('old about page')
        self.call('backup')
        self.call('deploy', self.payload({'index.html': 'clean home', '.htaccess': 'explicit redirects',
                                          'about/index.html': 'clean about'}))
        self.assertEqual((self.target / '.htaccess').read_text(), 'explicit redirects')
        self.assertEqual((self.target / 'about/index.html').read_text(), 'clean about')
        self.assertEqual((self.target / 'about.html').read_text(), 'old about page')
        self.assertEqual((self.target / 'remote-only.txt').read_text(), 'keep this')

    def test_redirect_configuration_is_not_activated_before_pages_finish(self):
        (self.target / '.htaccess').unlink()
        self.call('backup')
        self.code = self.code.replace('os.replace(temp, dest)',
                                      "if dest.name == 'index.html': raise RuntimeError('fixture upload failure')\n        os.replace(temp, dest)")
        self.call('deploy', self.payload({'index.html': 'new', '.htaccess': 'new redirects',
                                         'about/index.html': 'clean about'}), False)
        self.assertFalse((self.target / '.htaccess').exists())
        self.assertEqual((self.target / 'index.html').read_text(), 'old website')

    def test_corrupt_backup_blocks_publish(self):
        self.call('backup')
        with (self.backup / 'site.tar').open('ab') as stream:
            stream.write(b'corruption')
        self.call('deploy', self.payload(), False)
        self.assertEqual((self.target / 'index.html').read_text(), 'old website')

    def test_changed_remote_blocks_publish(self):
        self.call('backup')
        (self.target / 'remote-only.txt').write_text('edited after backup')
        self.call('deploy', self.payload(), False)
        self.assertEqual((self.target / 'index.html').read_text(), 'old website')

    def test_missing_backup_and_missing_destination_block_publish(self):
        self.call('deploy', self.payload(), False)
        missing = self.root / 'missing'
        self.code = self.code.replace(repr(str(self.target.resolve())), repr(str(missing)))
        self.call('inspect', success=False)
        self.assertFalse(missing.exists())

    def test_unsafe_payloads_do_not_modify_public_site(self):
        for index, name in enumerate(['../escape', '/absolute', '.env', 'node_modules/package.json'], 1):
            with self.subTest(name=name):
                # Each attempt uses a fresh exclusive deployment identifier.
                self.run_id = '123-' + str(index)
                self.call('backup')
                self.call('deploy', self.payload({'index.html': 'new', name: 'unsafe'}), False)
                self.assertEqual((self.target / 'index.html').read_text(), 'old website')

    def test_backup_failure_prevents_upload_and_removes_local_credentials(self):
        sys.dont_write_bytecode = True
        spec = importlib.util.spec_from_file_location(
            'deploy_hostinger', Path(__file__).with_name('deploy-hostinger.py'))
        deploy = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(deploy)
        (self.root / 'dist').mkdir()
        (self.root / 'dist/index.html').write_text('build')
        (self.root / 'scripts').mkdir()
        (self.root / 'scripts/hostinger-remote.py').write_text(CODE, encoding='utf-8')
        settings = {'HOSTINGER_SSH_KEY': 'fixture-key', 'HOSTINGER_HOST': 'example.invalid',
                    'HOSTINGER_PORT': '65002', 'HOSTINGER_USERNAME': 'fixture',
                    'HOSTINGER_TARGET_DIR': deploy.remote.TARGET.as_posix(),
                    'HOSTINGER_KNOWN_HOSTS': 'fixture-host-key',
                    'GITHUB_RUN_ID': '123', 'GITHUB_RUN_ATTEMPT': '1',
                    'RUNNER_TEMP': str(self.root)}
        calls = []
        def fake_ssh(args, **kwargs):
            calls.append(args)
            self.assertIn('StrictHostKeyChecking=yes', args)
            if len(calls) == 2:
                raise subprocess.CalledProcessError(1, args)
        with patch.object(deploy, 'ROOT', self.root), patch.dict(os.environ, settings), \
                patch.object(deploy.subprocess, 'run', side_effect=fake_ssh):
            with self.assertRaises(subprocess.CalledProcessError):
                deploy.main()
        self.assertEqual(len(calls), 2)  # Read-only inspection, then failed backup; no upload.
        self.assertTrue(calls[0][-1].endswith('inspect 123-1'))
        self.assertTrue(calls[1][-1].endswith('backup 123-1'))
        self.assertEqual(list(self.root.glob('hostinger-*')), [])


class CleanUrlRecovery(unittest.TestCase):
    def setUp(self):
        self.fixture = DeploymentSafety(methodName='runTest')
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.target = self.fixture.target
        (self.target / '.htaccess').unlink()
        (self.target / 'about.html').write_text('old about')
        self.fixture.call('backup')
        self.fixture.call('deploy', self.fixture.payload({
            'index.html': 'clean home', '.htaccess': 'migration redirects',
            'about/index.html': 'clean about'}))
        (self.target / 'index.html').write_text('old website')  # Completed git revert deployment.
        self.fixture.run_id = '124-1'
        self.fixture.call('backup')
        self.code = Path(__file__).with_name('rollback-clean-urls.py').read_text(encoding='utf-8').replace(
            "Path('/home/u721646606/domains/rumiware.com/public_html')", 'Path(' + repr(str(self.target.resolve())) + ')')

    def recover(self, success):
        result = subprocess.run([sys.executable, '-c', self.code, '123-1', '124-1'], capture_output=True)
        self.assertEqual(result.returncode == 0, success, result.stdout.decode() + result.stderr.decode())
        return result

    def test_only_unchanged_created_files_are_quarantined(self):
        self.recover(True)
        self.assertFalse((self.target / '.htaccess').exists())
        self.assertFalse((self.target / 'about').exists())
        self.assertEqual((self.target / 'about.html').read_text(), 'old about')
        self.assertEqual((self.target / 'index.html').read_text(), 'old website')
        self.assertEqual((self.target / 'remote-only.txt').read_text(), 'keep this')
        self.assertTrue((self.fixture.root / '.deployment-backups/124-1/clean-url-quarantine/.htaccess').is_file())

    def test_later_changes_to_created_files_block_all_cleanup(self):
        (self.target / 'about/index.html').write_text('later work')
        self.fixture.run_id = '125-1'
        self.fixture.call('backup')
        self.code = self.code.replace('migration_run, current_run = sys.argv[1:]', "migration_run, current_run = '123-1', '125-1'")
        self.recover(False)
        self.assertEqual((self.target / '.htaccess').read_text(), 'migration redirects')
        self.assertEqual((self.target / 'about/index.html').read_text(), 'later work')

    def test_remote_change_after_recovery_backup_blocks_cleanup(self):
        (self.target / 'remote-only.txt').write_text('changed after backup')
        self.recover(False)
        self.assertTrue((self.target / '.htaccess').is_file())

    def test_corrupt_migration_backup_blocks_cleanup(self):
        with (self.fixture.backup / 'site.tar').open('ab') as stream:
            stream.write(b'corruption')
        self.recover(False)
        self.assertTrue((self.target / '.htaccess').is_file())

    def test_unrelated_files_in_new_directories_are_retained(self):
        (self.target / 'about/later.txt').write_text('keep later content')
        self.fixture.run_id = '125-1'
        self.fixture.call('backup')
        self.code = self.code.replace('migration_run, current_run = sys.argv[1:]', "migration_run, current_run = '123-1', '125-1'")
        self.recover(True)
        self.assertEqual((self.target / 'about/later.txt').read_text(), 'keep later content')


if __name__ == '__main__':
    unittest.main(verbosity=2)
