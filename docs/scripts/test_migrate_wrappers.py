import unittest
import os
import shutil
import tempfile
from migrate_wrappers import migrate_wrappers

class TestMigrateWrappers(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.repo_root = self.test_dir
        self.source_dir = os.path.join(self.repo_root, 'docs', 'wrappers_source')
        self.dest_root = os.path.join(self.repo_root, 'docs')
        os.makedirs(self.source_dir)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_basic_migration(self):
        # Create a v0.9 wrapper file
        filename = 'v0.9-test.md'
        with open(os.path.join(self.source_dir, filename), 'w') as f:
            f.write('# Test Wrapper')

        migrate_wrappers(self.repo_root)

        # Check if it was moved to docs/v0.9/specification/docs
        dest_file = os.path.join(self.dest_root, 'v0.9', 'specification', 'docs', filename)
        self.assertTrue(os.path.exists(dest_file))
        with open(dest_file, 'r') as f:
            content = f.read()
        self.assertEqual(content, '# Test Wrapper')

    def test_include_path_rewrite(self):
        # Test rewriting of --8<-- includes
        filename = 'v0.9-include.md'
        with open(os.path.join(self.source_dir, filename), 'w') as f:
            f.write('--8<-- "docs/specification/v0_9/docs/test.md"')

        migrate_wrappers(self.repo_root)

        dest_file = os.path.join(self.dest_root, 'v0.9', 'specification', 'docs', filename)
        with open(dest_file, 'r') as f:
            content = f.read()

        # Should rewrite v0_9 to v0.9
        self.assertIn('docs/v0.9/specification/docs/test.md', content)

    def test_cross_version_link_rewrite(self):
        # Test rewriting of links to other versions
        filename = 'v0.9-links.md'
        with open(os.path.join(self.source_dir, filename), 'w') as f:
            f.write('[Link to v0.8](v0.8-test.md)\n[Link to v0.9](v0.9-other.md)')

        migrate_wrappers(self.repo_root)

        dest_file = os.path.join(self.dest_root, 'v0.9', 'specification', 'docs', filename)
        with open(dest_file, 'r') as f:
            content = f.read()

        # v0.8 link should be relative
        self.assertIn('(../../../v0.8/specification/docs/v0.8-test.md)', content)
        # v0.9 link should remain as is
        self.assertIn('(v0.9-other.md)', content)

if __name__ == '__main__':
    unittest.main()
