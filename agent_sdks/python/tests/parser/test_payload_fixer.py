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
from a2ui.parser.payload_fixer import (
    _remove_trailing_commas,
    _parse,
    parse_and_fix,
)


def test_remove_trailing_commas(caplog):
  """Tests that the fixer can handle and fix trailing commas in JSON lists and objects."""
  # Malformed JSON with a trailing comma in the list
  malformed_json_list = '[{"type": "Text", "text": "Hello"},]'
  fixed_json_list = _remove_trailing_commas(malformed_json_list)
  assert fixed_json_list == '[{"type": "Text", "text": "Hello"}]'

  # Malformed JSON with a trailing comma in the object
  malformed_json_obj = '{"type": "Text", "text": "Hello",}'
  fixed_json_obj = _remove_trailing_commas(malformed_json_obj)
  assert fixed_json_obj == '{"type": "Text", "text": "Hello"}'

  # Assert that the warning was logged
  assert "Detected trailing commas in LLM output; applied autofix." in caplog.text


def test_remove_trailing_commas_no_change():
  """Tests that the fixer does not modify valid JSON."""
  valid_json = '[{"type": "Text", "text": "Hello"}]'
  fixed_json = _remove_trailing_commas(valid_json)

  assert fixed_json == valid_json


def test_parse_payload_wrapping():
  """Tests that _parse auto-wraps single objects in a list."""
  obj_json = '{"type": "Text", "text": "Hello"}'
  parsed = _parse(obj_json)
  assert isinstance(parsed, list)
  assert len(parsed) == 1
  assert parsed[0]["type"] == "Text"


def test_fix_payload_success_first_time():
  """Tests that parse_and_fix returns the payload if it is valid immediately."""
  valid_json = '[{"type": "Text", "text": "Hello"}]'
  result = parse_and_fix(valid_json)

  assert result == [{"type": "Text", "text": "Hello"}]


def test_fix_payload_success_after_fix(caplog):
  """Tests that parse_and_fix applies fix if initial parsing fails."""
  malformed_json = '[{"type": "Text", "text": "Hello"},]'
  result = parse_and_fix(malformed_json)

  assert result == [{"type": "Text", "text": "Hello"}]
  assert "Initial A2UI payload validation failed" in caplog.text
  assert "Detected trailing commas in LLM output; applied autofix." in caplog.text


def test_normalizes_smart_quotes():
  """Replaces smart quotes with standard straight quotes."""
  smart_quotes_json = '{"type": “Text”, "other": "Value’s"}'
  result = parse_and_fix(smart_quotes_json)

  assert result == [{"type": "Text", "other": "Value's"}]
