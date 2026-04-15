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
from a2ui.parser.parser import parse_response, ResponsePart
from a2ui.schema.constants import A2UI_OPEN_TAG, A2UI_CLOSE_TAG


def test_parse_empty_response():
  content = ""
  with pytest.raises(ValueError, match="not found in response"):
    parse_response(content)


def test_parse_response_only_text_no_tags():
  content = "Only text, no tags."
  with pytest.raises(ValueError, match="not found in response"):
    parse_response(content)


def test_parse_response_empty_tags():
  content = f"{A2UI_OPEN_TAG}{A2UI_CLOSE_TAG}"
  with pytest.raises(ValueError, match="A2UI JSON part is empty"):
    parse_response(content)


def test_parse_response_only_json_with_tags():
  content = f'{A2UI_OPEN_TAG}\n[{{"id": "test"}}]\n{A2UI_CLOSE_TAG}'
  parts = parse_response(content)
  assert len(parts) == 1
  assert parts[0].text == ""
  assert parts[0].a2ui_json == [{"id": "test"}]


def test_parse_response_with_text_and_tags():
  content = f'Hello\n{A2UI_OPEN_TAG}\n[{{"id": "test"}}]\n{A2UI_CLOSE_TAG}'
  parts = parse_response(content)
  assert len(parts) == 1
  assert parts[0].text == "Hello"
  assert parts[0].a2ui_json == [{"id": "test"}]


def test_parse_response_with_trailing_text():
  content = f'Hello\n{A2UI_OPEN_TAG}\n[{{"id": "test"}}]\n{A2UI_CLOSE_TAG}\nGoodbye'
  parts = parse_response(content)
  assert len(parts) == 2
  assert parts[0].text == "Hello"
  assert parts[0].a2ui_json == [{"id": "test"}]
  assert parts[1].text == "Goodbye"
  assert parts[1].a2ui_json is None


def test_parse_response_multiple_blocks():
  content = """
Part 1
<a2ui-json>
[{"id": "1"}]
</a2ui-json>
Part 2
<a2ui-json>
[{"id": "2"}]
</a2ui-json>
Part 3
  """
  parts = parse_response(content)
  assert len(parts) == 3

  assert parts[0].text == "Part 1"
  assert parts[0].a2ui_json == [{"id": "1"}]

  assert parts[1].text == "Part 2"
  assert parts[1].a2ui_json == [{"id": "2"}]

  assert parts[2].text == "Part 3"
  assert parts[2].a2ui_json is None


def test_parse_response_with_markdown_blocks():
  content = (
      f"Text\n{A2UI_OPEN_TAG}\n```json\n"
      f'[{{"id": "test"}}]\n'
      f"```\n{A2UI_CLOSE_TAG}"
  )
  parts = parse_response(content)
  assert len(parts) == 1
  assert parts[0].text == "Text"
  assert parts[0].a2ui_json == [{"id": "test"}]


def test_parse_response_invalid_json():
  content = f"{A2UI_OPEN_TAG}\ninvalid_json\n{A2UI_CLOSE_TAG}"
  with pytest.raises(ValueError):
    parse_response(content)
