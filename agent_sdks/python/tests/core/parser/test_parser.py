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

import pytest
from a2ui.core.parser import parse_response
from a2ui.core.schema.constants import A2UI_DELIMITER


def test_parse_empty_response():
  content = ""
  with pytest.raises(ValueError, match="not found in response"):
    parse_response(content)


def test_parse_response_only_text_no_delimiter():
  content = "Only text, no delimiter."
  with pytest.raises(ValueError, match="not found in response"):
    parse_response(content)


def test_parse_response_only_text_with_delimiter():
  content = f"Only text, no delimiter. {A2UI_DELIMITER}```json```"
  with pytest.raises(ValueError, match="A2UI JSON part is empty"):
    parse_response(content)


def test_parse_response_only_json_no_delimiter():
  content = '[{"id": "test"}]'
  with pytest.raises(ValueError, match="not found in response"):
    parse_response(content)


def test_parse_response_only_json_with_delimiter():
  content = f'{A2UI_DELIMITER} [{{"id": "test"}}]'
  text, json_obj = parse_response(content)
  assert text == ""
  assert json_obj == [{"id": "test"}]


def test_parse_response_empty_json_list_with_delimiter():
  content = f"{A2UI_DELIMITER} [ ]"
  text, json_obj = parse_response(content)
  assert text == ""
  assert json_obj == []


def test_parse_response_empty_json_object_with_delimiter():
  content = f"{A2UI_DELIMITER} {{ }}"
  text, json_obj = parse_response(content)
  assert text == ""
  assert json_obj == [{}]


def test_parse_response_with_markdown_blocks():
  content = f'Text {A2UI_DELIMITER} ```json\n[{{"id": "test"}}]\n```'
  text, json_obj = parse_response(content)
  assert text == "Text"
  assert json_obj == [{"id": "test"}]


def test_parse_response_with_markdown_blocks_no_json_language():
  content = f'Text {A2UI_DELIMITER} ```\n[{{"id": "test"}}]\n```'
  text, json_obj = parse_response(content)
  assert text == "Text"
  assert json_obj == [{"id": "test"}]


def test_parse_response_no_markdown_blocks():
  content = f'Text {A2UI_DELIMITER} [{{"id": "test"}}]'
  text, json_obj = parse_response(content)
  assert text == "Text"
  assert json_obj == [{"id": "test"}]


def test_parse_response_invalid_json():
  content = f"Text {A2UI_DELIMITER} INVALID JSON"
  with pytest.raises(ValueError):
    parse_response(content)
