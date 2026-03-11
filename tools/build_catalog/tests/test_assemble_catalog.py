# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import unittest
from unittest.mock import patch, MagicMock
import json
import os
from pathlib import Path
import sys

# Add the parent directory to the path so we can import assemble_catalog
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))
from assemble_catalog import CatalogAssembler, BASIC_CATALOG_URLS, CatalogError
import urllib.error

class TestAssembleCatalog(unittest.TestCase):
    def setUp(self):
        self.fixtures_dir = Path(__file__).parent / "fixtures"
        self.basic_catalog_path = self.fixtures_dir / "basic_catalog.json"
        self.component1_path = self.fixtures_dir / "component1.json"
        self.component2_path = self.fixtures_dir / "component2.json"

    def test_local_assembly(self):
        # Assemble component1 and component2, intercepting basic_catalog locally
        assembler = CatalogAssembler(version="0.9", local_basic_catalog_path=str(self.basic_catalog_path))
        result = assembler.assemble("TestCatalog", [str(self.component1_path), str(self.component2_path)])

        self.assertEqual(result["$id"], "TestCatalog.json")
        self.assertEqual(result["catalogId"], "TestCatalog.json")
        self.assertEqual(result["title"], "TestCatalog A2UI Catalog")
        self.assertEqual(result["description"], f"TestCatalog A2UI catalog, including {self.component1_path.stem}, {self.component2_path.stem}.")
        self.assertIn("CustomHeader", result["components"])
        self.assertIn("Page", result["components"])

        # Verify the $refs were translated into internal $defs correctly
        self.assertIn("$defs", result)

        # We expect a definition for basic_catalog's Text component and component1's CustomHeader
        defs_keys = list(result["$defs"].keys())
        self.assertTrue(any("basic_catalog_Text" in k for k in defs_keys))
        self.assertTrue(any("component1_CustomHeader" in k for k in defs_keys))

    @patch('assemble_catalog.urllib.request.urlopen')
    def test_remote_basic_catalog_fallback(self, mock_urlopen):
        # Mock the HTTP response for basic_catalog.json
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "components": {
                "Text": {"type": "string"},
                "RemoteText": {"type": "string"}
            }
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_response

        # Assemble without a local basic_catalog_path, it MUST fetch from HTTP
        assembler = CatalogAssembler(version="0.10", local_basic_catalog_path=None)
        result = assembler.assemble("RemoteTest", [str(self.component1_path)])

        # Assert urlopen was called with the 0.10 URL
        called_req = mock_urlopen.call_args[0][0]
        self.assertEqual(called_req.full_url, BASIC_CATALOG_URLS["0.10"])

        self.assertIn("$defs", result)
        defs_keys = list(result["$defs"].keys())
        # The key should contain basic_catalog since we intercepted the target pointer path
        self.assertTrue(any("basic_catalog" in k for k in defs_keys))

    def test_extend_basic_catalog(self):
        # Assemble component1, which DOES NOT have all of basic_catalog natively (just CustomHeader's ref to Text)
        # But we pass extend_basic=True, so basic_catalog's entirety should be dumped into components
        assembler = CatalogAssembler(version="0.9", local_basic_catalog_path=str(self.basic_catalog_path))
        result = assembler.assemble("ExtendedCatalog", [str(self.component1_path)], extend_basic=True)

        self.assertEqual(result["title"], "ExtendedCatalog A2UI Catalog")
        self.assertIn("CustomHeader", result["components"])

        # Because we merged basic_catalog implicitly, Text should be directly in the top-level components
        self.assertIn("Text", result["components"])

    @patch('assemble_catalog.urllib.request.urlopen')
    def test_http_input_assembly(self, mock_urlopen):
        # Mock full fetching if the input itself is an HTTP URL
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "components": {
                "CloudWidget": {
                    "properties": {
                        "text": {"$ref": "basic_catalog.json#/components/Text"}
                    }
                }
            }
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_response

        assembler = CatalogAssembler(version="0.9", local_basic_catalog_path=str(self.basic_catalog_path))
        result = assembler.assemble("CloudCatalog", ["https://example.com/widget_catalog.json"])

        # Assert urlopen was called for the input catalog
        self.assertEqual(mock_urlopen.call_count, 1)
        self.assertEqual(mock_urlopen.call_args[0][0].full_url, "https://example.com/widget_catalog.json")

        self.assertIn("CloudWidget", result["components"])

        # Assert the inner basic_catalog.json ref correctly routed locally
        self.assertIn("$defs", result)
        defs_keys = list(result["$defs"].keys())
        self.assertTrue(any("basic_catalog" in k for k in defs_keys))

    def test_local_common_types_fallback(self):
        # The component3 mock references common_types.json directly.
        # This test ensures we properly intercept that reference if passed locally.
        common_types_path = self.fixtures_dir / "common_types.json"
        component3_path = self.fixtures_dir / "component3.json"

        assembler = CatalogAssembler(version="0.9", local_common_types_path=str(common_types_path))
        result = assembler.assemble("CommonTextCatalog", [str(component3_path)])

        self.assertIn("$defs", result)
        defs_keys = list(result["$defs"].keys())
        # The key should contain common_types since we intercepted the target pointer path
        self.assertTrue(any("common_types_DynamicString" in k for k in defs_keys))

    @patch('assemble_catalog.urllib.request.urlopen')
    def test_remote_common_types_fallback(self, mock_urlopen):
        # Mock the HTTP response for common_types.json
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "$defs": {
                "DynamicString": {"type": "string"}
            }
        }).encode('utf-8')
        mock_urlopen.return_value.__enter__.return_value = mock_response

        component3_path = self.fixtures_dir / "component3.json"

        # Assemble without a local common_types_path, it MUST fetch from HTTP
        assembler = CatalogAssembler(version="0.10", local_common_types_path=None)
        result = assembler.assemble("RemoteCommonTypes", [str(component3_path)])

        # Assert urlopen was called with the 0.10 URL for common_types.json
        called_req = mock_urlopen.call_args[0][0]
        from assemble_catalog import COMMON_TYPES_URLS
        self.assertEqual(called_req.full_url, COMMON_TYPES_URLS["0.10"])

        self.assertIn("$defs", result)
        defs_keys = list(result["$defs"].keys())
        # The key should contain common_types since we intercepted the target pointer path
        self.assertTrue(any("common_types_DynamicString" in k for k in defs_keys))

    def test_circular_dependency(self):
        # Create a mock schema with a circular $ref
        schema_with_loop = {
            "components": {
                "LoopBlock": {
                    "$ref": "memory://test#/components/LoopBlock"
                }
            }
        }

        assembler = CatalogAssembler(version="0.9", max_depth=5)

        # We manually call process_schema to trigger the recursion check
        # and mock fetch_json to always return the loop schema so it infinitely evaluates
        with patch.object(assembler, 'fetch_json', return_value=schema_with_loop):
            with self.assertRaises(CatalogError) as context:
                assembler.process_schema(schema_with_loop, "memory://test")

        self.assertIn("Max recursion depth reached", str(context.exception))

    @patch('assemble_catalog.logger')
    def test_collision_warning_on_merge(self, mock_logger):
        assembler = CatalogAssembler(version="0.9")

        # component1 and component2 do not collide. Let's merge component1 with ITSELF to force a collision.
        assembler.assemble("CollisionCatalog", [str(self.component1_path), str(self.component1_path)])

        # We should see a warning about 'CustomHeader' colliding
        mock_logger.warning.assert_called_with("Component collision: 'CustomHeader' already exists. Overwriting.")

    def test_missing_local_file(self):
        assembler = CatalogAssembler(version="0.9")
        missing_path = self.fixtures_dir / "does_not_exist.json"

        with self.assertRaises(CatalogError) as context:
            assembler.assemble("MissingCatalog", [str(missing_path)])

        self.assertIn("File not found:", str(context.exception))

    @patch('assemble_catalog.urllib.request.urlopen')
    def test_network_timeout(self, mock_urlopen):
        # URLError simulating a timeout
        mock_urlopen.side_effect = urllib.error.URLError("timeout")

        assembler = CatalogAssembler(version="0.9")

        with self.assertRaises(CatalogError) as context:
            assembler.fetch_json("https://example.com/slow_catalog.json")

        self.assertIn("Network error fetching", str(context.exception))
        self.assertIn("timeout", str(context.exception))

    @patch('assemble_catalog.Path.cwd')
    @patch('assemble_catalog.CatalogAssembler.assemble')
    def test_output_filename_generation(self, mock_assemble, mock_cwd):
        mock_assemble.return_value = {}
        import tempfile
        import assemble_catalog

        with tempfile.TemporaryDirectory() as temp_dir:
            mock_cwd.return_value = Path(temp_dir)

            # Test without .json provided
            with patch('sys.argv', ['assemble_catalog.py', '--name', 'MyCatalog', str(self.component1_path)]):
                assemble_catalog.main()

            out_file = Path(temp_dir) / "dist" / "MyCatalog.json"
            self.assertTrue(out_file.exists())

            # Test with .json provided
            with patch('sys.argv', ['assemble_catalog.py', '--name', 'MyCatalogWithExt.json', str(self.component1_path)]):
                assemble_catalog.main()

            out_file2 = Path(temp_dir) / "dist" / "MyCatalogWithExt.json"
            self.assertTrue(out_file2.exists())
            # Ensure it did not double append the extension
            self.assertFalse((Path(temp_dir) / "dist" / "MyCatalogWithExt.json.json").exists())

if __name__ == '__main__':
    unittest.main()
