# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import pytest
import jsonschema
from unittest.mock import MagicMock
from a2ui.inference.schema.catalog import A2uiCatalog
from a2ui.inference.schema.payload_fixer import A2uiPayloadFixer


def test_remove_trailing_commas(caplog):
  """Tests that the fixer can handle and fix trailing commas in JSON lists and objects."""
  catalog_mock = MagicMock(spec=A2uiCatalog)
  fixer = A2uiPayloadFixer(catalog_mock)

  # Malformed JSON with a trailing comma in the list
  malformed_json_list = '[{"type": "Text", "text": "Hello"},]'
  fixed_json_list = fixer._remove_trailing_commas(malformed_json_list)
  assert fixed_json_list == '[{"type": "Text", "text": "Hello"}]'

  # Malformed JSON with a trailing comma in the object
  malformed_json_obj = '{"type": "Text", "text": "Hello",}'
  fixed_json_obj = fixer._remove_trailing_commas(malformed_json_obj)
  assert fixed_json_obj == '{"type": "Text", "text": "Hello"}'

  # Assert that the warning was logged
  assert "Detected trailing commas in LLM output; applied autofix." in caplog.text


def test_remove_trailing_commas_no_change():
  """Tests that the fixer does not modify valid JSON."""
  catalog_mock = MagicMock(spec=A2uiCatalog)
  fixer = A2uiPayloadFixer(catalog_mock)

  valid_json = '[{"type": "Text", "text": "Hello"}]'
  fixed_json = fixer._remove_trailing_commas(valid_json)

  assert fixed_json == valid_json


def test_parse_payload_wrapping():
  """Tests that _parse_payload auto-wraps single objects in a list."""
  catalog_mock = MagicMock(spec=A2uiCatalog)
  fixer = A2uiPayloadFixer(catalog_mock)

  obj_json = '{"type": "Text", "text": "Hello"}'
  parsed = fixer._parse(obj_json)
  assert isinstance(parsed, list)
  assert len(parsed) == 1
  assert parsed[0]["type"] == "Text"


def test_fix_payload_success_first_time():
  """Tests that fix_payload returns the payload if it is valid immediately."""
  catalog_mock = MagicMock(spec=A2uiCatalog)
  fixer = A2uiPayloadFixer(catalog_mock)

  valid_json = '[{"type": "Text", "text": "Hello"}]'
  result = fixer.validate_and_fix(valid_json)

  assert result == [{"type": "Text", "text": "Hello"}]
  catalog_mock.validator.validate.assert_called_once()


def test_fix_payload_success_after_fix(caplog):
  """Tests that fix_payload applies fix if initial validation fails."""
  catalog_mock = MagicMock(spec=A2uiCatalog)

  # Mock validate to fail first time, then succeed
  def side_effect(instance):
    # This is a bit simplified, but demonstrates the flow
    if len(instance) == 0:  # Should not happen with our test data but for example
      raise jsonschema.exceptions.ValidationError("Empty list")
    # In reality, initial parse will fail for trailing comma, so we need to mock that too.
    pass

  catalog_mock.validator.validate.side_effect = side_effect
  fixer = A2uiPayloadFixer(catalog_mock)

  malformed_json = '[{"type": "Text", "text": "Hello"},]'
  result = fixer.validate_and_fix(malformed_json)

  assert result == [{"type": "Text", "text": "Hello"}]
  assert "Initial A2UI payload validation failed" in caplog.text
  assert "Detected trailing commas in LLM output; applied autofix." in caplog.text
