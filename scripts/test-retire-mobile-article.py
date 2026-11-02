"""Local safety tests for the two-file retirement; no SSH or credentials."""
import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
import sys
from unittest.mock import patch
sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parent.parent


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


class ArticleRetirement(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.target = Path(self.temp.name) / 'public_html'
        self.target.mkdir()
        self.remote = module('retirement_deploy', 'hostinger-remote.py')
        self.recovery = module('retirement_backup', 'rollback-clean-urls.py')
        self.operation = module('retirement_operation', 'retire-mobile-article.py')
        self.backups = self.target.parent / '.deployment-backups'
        for m in [self.remote, self.recovery]:
            m.TARGET = self.target
            m.BACKUPS = self.backups
        (self.target / '.htaccess').write_bytes((ROOT / 'config/clean-url-redirects.conf').read_bytes().replace(b'\r\n', b'\n'))
        (self.target / 'blog/fast-mobile-website').mkdir(parents=True)
        (self.target / 'blog/future-of-ai').mkdir(parents=True)
        (self.target / 'blog/future-of-ai/index.html').write_text('Preserve AI article')
        (self.target / 'blog/fast-mobile-website/remote-only.webp').write_bytes(b'preserve remote-only image')
        self.manifest = {'retiredFiles': {}}
        for name in self.operation.FILES:
            content = name.encode()
            (self.target / name).write_bytes(content)
            self.manifest['retiredFiles'][name] = hashlib.sha256(content).hexdigest()
        self.backup()

    def backup(self, run='999-1'):
        with patch('sys.argv', ['helper', 'backup', run]):
            self.remote.main()

    def retire(self, run='999-1'):
        self.operation.retire(vars(self.recovery), run, self.manifest)

    def test_only_the_two_inspected_files_move_and_backup_remains_verifiable(self):
        before = self.recovery.snapshot(self.target)
        self.retire()
        for name in self.operation.FILES:
            self.assertFalse((self.target / name).exists())
            self.assertEqual(self.operation.digest(self.backups / '999-1/retired-mobile-article' / name), self.manifest['retiredFiles'][name])
        self.assertEqual(self.recovery.snapshot(self.target), {k: v for k, v in before.items() if k not in self.operation.FILES})
        self.recovery.backup('999-1')

    def test_changed_second_article_blocks_all_moves(self):
        second = self.target / 'blog/fast-mobile-website/index.html'
        second.write_text('Later content must survive')
        self.backup('999-2')
        with self.assertRaisesRegex(RuntimeError, 'Article file changed'):
            self.retire('999-2')
        self.assertTrue((self.target / 'blog-post.html').is_file())
        self.assertEqual(second.read_text(), 'Later content must survive')

    def test_corrupt_backup_and_concurrent_site_edit_block_retirement(self):
        archive = self.backups / '999-1/site.tar'
        with archive.open('ab') as f:
            f.write(b'corruption')
        with self.assertRaises(RuntimeError):
            self.retire()
        self.assertTrue((self.target / 'blog-post.html').exists())
        self.backup('999-2')
        (self.target / 'later.txt').write_text('concurrent edit')
        with self.assertRaisesRegex(RuntimeError, 'changed after backup'):
            self.retire('999-2')

    def test_unreviewed_config_and_extra_targets_are_rejected(self):
        self.manifest['retiredFiles']['unrelated.html'] = 'a' * 64
        with self.assertRaisesRegex(RuntimeError, 'allowlist'):
            self.retire()
        del self.manifest['retiredFiles']['unrelated.html']
        (self.target / '.htaccess').write_text('unrelated rules')
        self.backup('999-2')
        with self.assertRaisesRegex(RuntimeError, '410 configuration'):
            self.retire('999-2')
        self.assertTrue((self.target / 'blog-post.html').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
