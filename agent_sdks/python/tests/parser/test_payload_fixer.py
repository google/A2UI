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

import logging

import pytest

from a2ui.parser.payload_fixer import parse_and_fix


@pytest.mark.parametrize(
    "payload,expected",
    [
        (
            '[{"beginRendering": {"surfaceId": "s1", "root": "r1"}}]',
            [{"beginRendering": {"surfaceId": "s1", "root": "r1"}}],
        ),
        (
            '{"beginRendering": {"surfaceId": "s1", "root": "r1"}}',
            [{"beginRendering": {"surfaceId": "s1", "root": "r1"}}],
        ),
        ("{\u201ckey\u201d: \u201cvalue\u201d}", [{"key": "value"}]),
        (
            "{\u201Couter\u201D: {\u201Cinner\u201D: true}}",
            [{"outer": {"inner": True}}],
        ),
        ("[]", []),
        ("[1, 2,]", [1, 2]),
    ],
)
def test_parse_and_fix_normalization(payload, expected):
  assert parse_and_fix(payload) == expected


@pytest.mark.parametrize(
    "payload,expected",
    [
        ('[{"key": "value",}]', [{"key": "value"}]),
        ('[{"items": ["a", "b",]}]', [{"items": ["a", "b"]}]),
        ('[{"a": 1, "b": [1, 2,]}]', [{"a": 1, "b": [1, 2]}]),
        ('{"a": {"b": 1,}}', [{"a": {"b": 1}}]),
        ('[{"a": [1, 2, 3,]}]', [{"a": [1, 2, 3]}]),
    ],
)
def test_parse_and_fix_trailing_comma(payload, expected):
  assert parse_and_fix(payload) == expected


def test_parse_and_fix_multiple_messages():
  payload = (
      '[{"beginRendering": {"surfaceId": "s1", "root": "r1"}}, {"surfaceUpdate":'
      ' {"surfaceId": "s1", "components": []}}]'
  )
  result = parse_and_fix(payload)
  assert len(result) == 2
  assert "beginRendering" in result[0]
  assert "surfaceUpdate" in result[1]


def test_parse_and_fix_single_object_wrapped_in_list():
  payload = '{"beginRendering": {"surfaceId": "s1", "root": "r1"}}'
  result = parse_and_fix(payload)
  assert isinstance(result, list)
  assert len(result) == 1


def test_parse_and_fix_logs_warnings_on_trailing_comma_autofix(caplog):
  payload = '[{"key": "value",}]'
  with caplog.at_level(logging.WARNING, logger="a2ui.parser.payload_fixer"):
    result = parse_and_fix(payload)
  log_messages = [r.message for r in caplog.records]
  assert any("Initial A2UI payload validation failed" in msg for msg in log_messages)
  assert any(
      "Detected trailing commas in LLM output; applied autofix." in msg
      for msg in log_messages
  )
  assert result == [{"key": "value"}]


@pytest.mark.parametrize(
    "payload",
    [
        "this is not json at all",
        "",
        "{",
        "[",
        '{"key": "value"',
        '[{"key": "value",]',
    ],
)
def test_parse_and_fix_invalid_payload_raises_value_error(payload):
  with pytest.raises(ValueError, match="Failed to parse JSON"):
    parse_and_fix(payload)
