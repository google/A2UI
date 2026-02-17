import unittest
import os
import shutil
import tempfile
from unittest.mock import patch
import sys
sys.path.append(os.path.join(os.path.dirname(__file__)))
from prepare_docs import prepare_docs

class TestPrepareDocs(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.repo_root = self.test_dir
        self.spec_dir = os.path.join(self.repo_root, 'specification')
        self.docs_dir = os.path.join(self.repo_root, 'docs')
        os.makedirs(self.spec_dir)
        os.makedirs(self.docs_dir)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_basic_copy(self):
        # Create a mock specification version
        v0_9_dir = os.path.join(self.spec_dir, 'v0_9')
        os.makedirs(v0_9_dir)
        with open(os.path.join(v0_9_dir, 'test.md'), 'w') as f:
            f.write('# Test')

        prepare_docs(self.repo_root)

        # Check if it was copied to docs/v0.9/specification
        dest_file = os.path.join(self.docs_dir, 'v0.9', 'specification', 'test.md')
        self.assertTrue(os.path.exists(dest_file))

    def test_json_flattening(self):
        # Create a mock specification version with a json subdirectory
        v0_9_dir = os.path.join(self.spec_dir, 'v0_9')
        json_dir = os.path.join(v0_9_dir, 'json')
        os.makedirs(json_dir)
        with open(os.path.join(json_dir, 'schema.json'), 'w') as f:
            f.write('{}')

        prepare_docs(self.repo_root)

        # Check if JSON was moved to root of versioned spec
        dest_json = os.path.join(self.docs_dir, 'v0.9', 'specification', 'schema.json')
        self.assertTrue(os.path.exists(dest_json))
        # Check if json dir was removed
        dest_json_dir = os.path.join(self.docs_dir, 'v0.9', 'specification', 'json')
        self.assertFalse(os.path.exists(dest_json_dir))

    def test_link_rewriting_v0_9(self):
         # Create v0.9 files
        v0_9_dir = os.path.join(self.spec_dir, 'v0_9')
        docs_dir = os.path.join(v0_9_dir, 'docs')
        os.makedirs(docs_dir)

        protocol_path = os.path.join(docs_dir, 'a2ui_protocol.md')
        with open(protocol_path, 'w') as f:
            f.write('[Evolution Guide](evolution_guide.md)\n[Schema](../json/schema.json)')

        prepare_docs(self.repo_root)

        dest_protocol = os.path.join(self.docs_dir, 'v0.9', 'specification', 'docs', 'a2ui_protocol.md')
        with open(dest_protocol, 'r') as f:
            content = f.read()

        self.assertIn('(v0.9-evolution-guide.md)', content)
        self.assertIn('(../schema.json)', content) # ../json/ -> ../

    @patch('prepare_docs.migrate_wrappers')
    def test_main_calls_migrate_wrappers(self, mock_migrate):
        from prepare_docs import main
        # We need to mock sys.argv or just call main directly if it doesn't use args
        # prepare_docs.main() calculates repo_root and calls prepare_docs and migrate_wrappers
        # We want to verified that migrate_wrappers is called.

        # We also need to mock prepare_docs(repo_root) to avoid actual work
        with patch('prepare_docs.prepare_docs') as mock_prepare:
            main()
            self.assertTrue(mock_migrate.called)
            self.assertTrue(mock_prepare.called)

if __name__ == '__main__':
    unittest.main()
