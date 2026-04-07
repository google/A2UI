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
import copy
from unittest.mock import MagicMock
import pytest
from a2ui.core.schema.constants import (
    A2UI_OPEN_TAG,
    A2UI_CLOSE_TAG,
    VERSION_0_9,
    SURFACE_ID_KEY,
    CATALOG_COMPONENTS_KEY,
)
from a2ui.core.parser.constants import (
    MSG_TYPE_CREATE_SURFACE,
    MSG_TYPE_UPDATE_COMPONENTS,
    MSG_TYPE_DELETE_SURFACE,
    MSG_TYPE_DATA_MODEL_UPDATE,
)
from a2ui.core.schema.catalog import A2uiCatalog
from a2ui.core.parser.streaming import A2uiStreamParser
from a2ui.core.parser.response_part import ResponsePart


@pytest.fixture
def mock_catalog():
  s2c_schema = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "$id": "https://a2ui.org/specification/v0_9/server_to_client.json",
      "title": "A2UI Message Schema",
      "type": "object",
      "oneOf": [
          {"$ref": "#/$defs/CreateSurfaceMessage"},
          {"$ref": "#/$defs/UpdateComponentsMessage"},
          {"$ref": "#/$defs/UpdateDataModelMessage"},
          {"$ref": "#/$defs/DeleteSurfaceMessage"},
      ],
      "$defs": {
          "CreateSurfaceMessage": {
              "type": "object",
              "properties": {
                  "version": {"const": "v0.9"},
                  "createSurface": {
                      "type": "object",
                      "properties": {
                          "surfaceId": {
                              "type": "string",
                          },
                          "catalogId": {
                              "type": "string",
                          },
                          "theme": {
                              "type": "object",
                              "additionalProperties": True,
                          },
                      },
                      "required": ["surfaceId", "catalogId"],
                      "additionalProperties": False,
                  },
              },
              "required": ["version", "createSurface"],
              "additionalProperties": False,
          },
          "UpdateComponentsMessage": {
              "type": "object",
              "properties": {
                  "version": {"const": "v0.9"},
                  "updateComponents": {
                      "type": "object",
                      "properties": {
                          "surfaceId": {
                              "type": "string",
                          },
                          "root": {
                              "type": "string",
                          },
                          "components": {
                              "type": "array",
                              "minItems": 1,
                              "items": {"$ref": "catalog.json#/$defs/anyComponent"},
                          },
                      },
                      "required": ["surfaceId", "components"],
                      "additionalProperties": False,
                  },
              },
              "required": ["version", "updateComponents"],
              "additionalProperties": False,
          },
          "UpdateDataModelMessage": {
              "type": "object",
              "properties": {
                  "version": {"const": "v0.9"},
                  "updateDataModel": {
                      "type": "object",
                      "properties": {
                          "surfaceId": {
                              "type": "string",
                          },
                          "value": {"additionalProperties": True},
                      },
                      "required": ["surfaceId"],
                      "additionalProperties": False,
                  },
              },
              "required": ["version", "updateDataModel"],
              "additionalProperties": False,
          },
          "DeleteSurfaceMessage": {
              "type": "object",
              "properties": {
                  "version": {"const": "v0.9"},
                  "deleteSurface": {
                      "type": "object",
                      "properties": {"surfaceId": {"type": "string"}},
                      "required": ["surfaceId"],
                  },
              },
              "required": ["version", "deleteSurface"],
          },
      },
  }
  catalog_schema = {
      "catalogId": "test_catalog",
      "components": {
          "Container": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
              ],
              "properties": {
                  "component": {"const": "Container"},
                  "children": {
                      "type": "array",
                      "items": {"type": "string"},
                  },
              },
              "required": ["component", "children"],
          },
          "Card": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
              ],
              "properties": {
                  "component": {"const": "Card"},
                  "child": {"$ref": "common_types.json#/$defs/ComponentId"},
              },
              "required": ["component", "child"],
          },
          "Text": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
              ],
              "properties": {
                  "component": {"const": "Text"},
                  "text": {"$ref": "common_types.json#/$defs/DynamicString"},
              },
              "required": ["component", "text"],
          },
          "Column": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
              ],
              "properties": {
                  "component": {"const": "Column"},
                  "children": {"$ref": "common_types.json#/$defs/ChildList"},
              },
              "required": ["component", "children"],
          },
          "AudioPlayer": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
                  {
                      "type": "object",
                      "properties": {
                          "component": {"const": "AudioPlayer"},
                          "url": {"$ref": "common_types.json#/$defs/DynamicString"},
                          "description": {
                              "$ref": "common_types.json#/$defs/DynamicString"
                          },
                      },
                      "required": ["component", "url"],
                  },
              ],
          },
          "List": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
                  {
                      "type": "object",
                      "properties": {
                          "component": {"const": "List"},
                          "children": {"$ref": "common_types.json#/$defs/ChildList"},
                          "direction": {
                              "type": "string",
                              "enum": ["vertical", "horizontal"],
                          },
                      },
                      "required": ["component", "children"],
                  },
              ],
          },
          "Row": {
              "type": "object",
              "allOf": [
                  {"$ref": "common_types.json#/$defs/ComponentCommon"},
                  {"$ref": "#/$defs/CatalogComponentCommon"},
                  {
                      "type": "object",
                      "properties": {
                          "component": {"const": "Row"},
                          "children": {"$ref": "common_types.json#/$defs/ChildList"},
                      },
                      "required": ["component", "children"],
                  },
              ],
          },
      },
      "$defs": {
          "CatalogComponentCommon": {
              "type": "object",
              "properties": {"weight": {"type": "number"}},
          },
          "anyComponent": {
              "oneOf": [
                  {"$ref": "#/components/Container"},
                  {"$ref": "#/components/Card"},
                  {"$ref": "#/components/Text"},
                  {"$ref": "#/components/Column"},
                  {"$ref": "#/components/AudioPlayer"},
                  {"$ref": "#/components/List"},
                  {"$ref": "#/components/Row"},
              ],
              "discriminator": {"propertyName": "component"},
          },
      },
  }
  common_types_schema = {
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "$id": "https://a2ui.org/specification/v0_9/common_types.json",
      "title": "A2UI Common Types",
      "$defs": {
          "ComponentId": {
              "type": "string",
          },
          "AccessibilityAttributes": {
              "type": "object",
              "properties": {
                  "label": {
                      "$ref": "#/$defs/DynamicString",
                  }
              },
          },
          "Action": {"type": "object", "additionalProperties": True},
          "ComponentCommon": {
              "type": "object",
              "properties": {"id": {"$ref": "#/$defs/ComponentId"}},
              "required": ["id"],
          },
          "DataBinding": {"type": "object"},
          "DynamicString": {
              "anyOf": [{"type": "string"}, {"$ref": "#/$defs/DataBinding"}]
          },
          "DynamicValue": {
              "anyOf": [
                  {"type": "object"},
                  {"type": "array"},
                  {"$ref": "#/$defs/DataBinding"},
              ]
          },
          "DynamicNumber": {
              "anyOf": [{"type": "number"}, {"$ref": "#/$defs/DataBinding"}]
          },
          "ChildList": {
              "oneOf": [
                  {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}},
                  {
                      "type": "object",
                      "properties": {
                          "componentId": {"$ref": "#/$defs/ComponentId"},
                          "path": {"type": "string"},
                      },
                      "required": ["componentId", "path"],
                      "additionalProperties": False,
                  },
              ]
          },
      },
  }
  return A2uiCatalog(
      version=VERSION_0_9,
      name="test_catalog",
      s2c_schema=s2c_schema,
      common_types_schema=common_types_schema,
      catalog_schema=catalog_schema,
  )


def _normalize_messages(messages):
  """Sorts components in messages for stable comparison."""
  # Support ResponsePart list by extracting a2ui_json
  res = []
  for m in messages:
    if isinstance(m, ResponsePart):
      if m.a2ui_json:
        if isinstance(m.a2ui_json, list):
          res.extend(copy.deepcopy(m.a2ui_json))
        else:
          res.append(copy.deepcopy(m.a2ui_json))
    else:
      res.append(copy.deepcopy(m))

  for msg in res:
    if MSG_TYPE_UPDATE_COMPONENTS in msg:
      payload = msg[MSG_TYPE_UPDATE_COMPONENTS]
      if CATALOG_COMPONENTS_KEY in payload:
        payload[CATALOG_COMPONENTS_KEY].sort(key=lambda x: x.get("id", ""))
  return res


def assertResponseContainsMessages(response, expected_messages):
  """Asserts that the response parts contain the expected messages."""
  assert _normalize_messages(response) == _normalize_messages(expected_messages)


def assertResponseContainsNoA2UI(response):
  assert len(response) == 0 or response[0].a2ui_json == None


def assertResponseContainsText(response, expected_text):
  """Asserts that the response parts contain the expected text."""
  assert any(
      (p.text if isinstance(p, ResponsePart) else p) == expected_text for p in response
  )


def test_incremental_yielding_v09(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. CreateSurface initializes the session
  chunk1 = "Here is your"
  chunk2 = f" response.{A2UI_OPEN_TAG}["
  chunk3 = '{"version": "v0.9", "createSurface": {"surfaceId": "s1", "catalogId":'
  chunk4 = ' "test_catalog'
  chunk5 = '"'
  chunk6 = "}},"

  response_parts = parser.process_chunk(chunk1)
  assertResponseContainsText(response_parts, "Here is your")
  assertResponseContainsNoA2UI(response_parts)

  response_parts = parser.process_chunk(chunk2)
  assertResponseContainsText(response_parts, " response.")
  assertResponseContainsNoA2UI(response_parts)

  response_parts = parser.process_chunk(chunk3)
  assertResponseContainsNoA2UI(response_parts)

  response_parts = parser.process_chunk(chunk4)
  assertResponseContainsNoA2UI(response_parts)

  # CreateSurface should not be yielded yet because createSurface is not closing.
  response_parts = parser.process_chunk(chunk5)
  assertResponseContainsNoA2UI(response_parts)

  response_parts = parser.process_chunk(chunk6)
  expected = [{
      "version": "v0.9",
      "createSurface": {"surfaceId": "s1", "catalogId": "test_catalog"},
  }]
  assertResponseContainsMessages(response_parts, expected)

  # 2. Add root component via updateComponents
  surface_chunk_1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": ['
  )
  surface_chunk_2 = '{"id": "root", "component": "Column", "children": ['
  surface_chunk_3 = '"c1",'
  surface_chunk_4 = '"c2"]}]}}'

  response_parts = parser.process_chunk(surface_chunk_1)
  assertResponseContainsNoA2UI(response_parts)
  # Root is seen but incomplete
  response_parts = parser.process_chunk(surface_chunk_2)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Column",
                  "children": ["loading_children_root"],
              },
              {
                  "id": "loading_children_root",
                  **parser._placeholder_component,
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  # Child c1 loading
  response_parts = parser.process_chunk(surface_chunk_3)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Column",
                  "children": ["loading_c1"],
              },
              {
                  "id": "loading_c1",
                  **parser._placeholder_component,
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  # Child c2 loading
  response_parts = parser.process_chunk(surface_chunk_4)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Column",
                  "children": ["loading_c1", "loading_c2"],
              },
              {
                  "id": "loading_c1",
                  **parser._placeholder_component,
              },
              {
                  "id": "loading_c2",
                  **parser._placeholder_component,
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Add child components
  c1_chunk = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components": ['
      '{"id": "c1", "component": "Text", "text": "hello"}]}}'
  )
  c2_chunk = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components": ['
      '{"id": "c2", "component": "Text", "text": "world"}]}}'
  )

  response_parts = parser.process_chunk(c1_chunk)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Column",
                  "children": ["c1", "loading_c2"],
              },
              {
                  "id": "c1",
                  "component": "Text",
                  "text": "hello",
              },
              {
                  "id": "loading_c2",
                  **parser._placeholder_component,
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  response_parts = parser.process_chunk(c2_chunk)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Column",
                  "children": ["c1", "c2"],
              },
              {
                  "id": "c1",
                  "component": "Text",
                  "text": "hello",
              },
              {
                  "id": "c2",
                  "component": "Text",
                  "text": "world",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_waiting_for_root_component(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # Send a non-root component but keep the updateComponents message open
  chunk = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "c1", "component": "Text", "text": "hello"}'
  )
  response_parts = parser.process_chunk(chunk)
  # Should not yield anything because no reachable components from root yet
  assertResponseContainsNoA2UI(response_parts)

  # Now send the root and close the updateComponents message
  chunk_root = (
      f', {{"id": "root", "component": "Card", "child": "c1"}}]}}}} {A2UI_CLOSE_TAG}'
  )
  response_parts = parser.process_chunk(chunk_root)
  # Should yield createSurface and the updateComponents with both components
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "c1",
                  "component": "Text",
                  "text": "hello",
              },
              {
                  "id": "root",
                  "component": "Card",
                  "child": "c1",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_complete_surface_ignore_orphan_component(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}}, '
  )
  parser.process_chunk(chunk)

  chunk += (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": "root"}, {"id":'
      ' "orphan", "component": "Text", "text": "orphan"}]}}]'
  )
  chunk += A2UI_CLOSE_TAG

  response_parts = parser.process_chunk(chunk)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Text",
                  "text": "root",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_circular_reference_detection(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # c1 -> c2
  parser.process_chunk(
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "c1",'
      ' "components": [{"id": "c1", "component": "Card", "child": "c2"}]}},'
  )

  # c2 -> c1 (Cycle!)
  with pytest.raises(ValueError, match="Circular reference detected"):
    parser.process_chunk(
        '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components":'
        ' [{"id": "c2", "component": "Card", "child": "c1"}]}}'
    )


def test_self_reference_detection(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # c1 -> c1 (Self-reference!)
  with pytest.raises(ValueError, match="Self-reference detected"):
    parser.process_chunk(
        '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "c1",'
        ' "components": [{"id": "c1", "component": "Card", "child": "c1"}]}}'
    )


def test_interleaved_conversational_text():
  # No catalog needed for basic text extraction and unvalidated JSON parsing
  parser = A2uiStreamParser(catalog=None)

  # Chunk 1: purely conversational
  messages = parser.process_chunk("Hello! ")
  assert messages == [ResponsePart(text="Hello! ", a2ui_json=None)]

  # Chunk 2: start of A2UI block
  messages = parser.process_chunk(f"Here is your UI: {A2UI_OPEN_TAG}")
  assert messages == [ResponsePart(text="Here is your UI: ", a2ui_json=None)]

  # Chunk 3: A2UI content
  messages = parser.process_chunk(
      '[{"createSurface": {"root": "root", "surfaceId": "s1"}}]'
  )
  assert any(
      m.a2ui_json
      and (
          any("createSurface" in msg for msg in m.a2ui_json)
          if isinstance(m.a2ui_json, list)
          else "createSurface" in m.a2ui_json
      )
      for m in messages
  )

  # Chunk 4: Closing A2UI and more text
  messages = parser.process_chunk(f"{A2UI_CLOSE_TAG} That's all!")
  assert messages == [ResponsePart(text=" That's all!", a2ui_json=None)]


def test_split_tag_handling_for_text():
  parser = A2uiStreamParser(catalog=None)

  # Split A2UI_OPEN_TAG: "<a2u" and "i-json>"
  tag_part1 = A2UI_OPEN_TAG[:4]
  tag_part2 = A2UI_OPEN_TAG[4:]

  # Chunk 1: text followed by split tag
  messages = parser.process_chunk(f"Talking {tag_part1}")
  # "Talking " should be yielded because it's definitively not part of the tag prefix
  assert messages == [ResponsePart(text="Talking ", a2ui_json=None)]

  # Chunk 2: completes the tag
  messages = parser.process_chunk(tag_part2)
  # Should transition to A2UI mode, no new text yielded
  assert len(messages) == 0

  # Chunk 3: A2UI content + close tag + text
  messages = parser.process_chunk(
      f'[{{"createSurface": {{"root": "r", "surfaceId": "s"}}}}] {A2UI_CLOSE_TAG} End.'
  )
  texts = [m.text for m in messages if m.text]
  assert " End." in texts


def test_create_surface_missing_catalog_id(mock_catalog):
  """Verifies that v0.9 createSurface fails when catalogId is missing."""
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(A2UI_OPEN_TAG)

  # Missing catalogId
  chunk = '[{"version": "v0.9", "createSurface": {"surfaceId": "s1"}}]'
  with pytest.raises(ValueError, match="required property"):
    parser.process_chunk(chunk)


def test_only_create_surface(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  response_parts = parser.process_chunk(A2UI_OPEN_TAG)
  assert response_parts == []

  response_parts = parser.process_chunk("[")
  assert response_parts == []

  chunk = (
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1", "theme": {"primaryColor": "#FF0000",'
  )
  response_parts = parser.process_chunk(chunk)
  # createSurface is not yielded until the entire message is received
  assert response_parts == []

  response_parts = parser.process_chunk('"font": "Roboto"}')  # closing styles
  assert response_parts == []

  response_parts = parser.process_chunk("}")  # closing createSurface
  assert response_parts == []

  response_parts = parser.process_chunk("}")  # closing the item in the list
  expected = [
      {
          "version": "v0.9",
          "createSurface": {
              "catalogId": "test_catalog",
              "surfaceId": "s1",
              "theme": {"primaryColor": "#FF0000", "font": "Roboto"},
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_add_msg_type_deduplication():
  parser = A2uiStreamParser()
  parser.add_msg_type(MSG_TYPE_UPDATE_COMPONENTS)
  parser.add_msg_type(MSG_TYPE_UPDATE_COMPONENTS)
  assert parser.msg_types == [MSG_TYPE_UPDATE_COMPONENTS]

  parser.add_msg_type(MSG_TYPE_CREATE_SURFACE)
  assert parser.msg_types == [MSG_TYPE_UPDATE_COMPONENTS, MSG_TYPE_CREATE_SURFACE]
  parser.add_msg_type(MSG_TYPE_UPDATE_COMPONENTS)
  assert parser.msg_types == [MSG_TYPE_UPDATE_COMPONENTS, MSG_TYPE_CREATE_SURFACE]


def test_streaming_msg_type_deduplication(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  # 1. Send partial chunk that triggers sniffing
  chunk1 = (
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": "Hello"}'
  )
  parser.process_chunk(chunk1)

  assert MSG_TYPE_UPDATE_COMPONENTS in parser.msg_types
  assert parser.msg_types.count(MSG_TYPE_UPDATE_COMPONENTS) == 1

  # 2. Send the rest, which triggers handle_complete_object
  chunk2 = f', {{"id": "c1", "component": "Text", "text": "hi"}}]}}}} {A2UI_CLOSE_TAG}'
  parser.process_chunk(chunk2)

  # After completion, msg_types is reset
  assert not parser.msg_types


def test_multiple_a2ui_blocks(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Block 1: createSurface
  chunk1 = (
      f'Some text here {A2UI_OPEN_TAG}[{{"version": "v0.9", "createSurface":'
      f' {{"catalogId": "test_catalog", "surfaceId": "s1"}}}}] {A2UI_CLOSE_TAG} mid'
      " text"
  )
  response_parts = parser.process_chunk(chunk1)
  assert len(response_parts) == 2
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "s1"},
      },
  ]
  assertResponseContainsMessages(response_parts, expected)
  assertResponseContainsText(response_parts, "Some text here ")
  assertResponseContainsText(response_parts, " mid text")

  # Block 2: updateComponents
  chunk2 = (
      f' more text {A2UI_OPEN_TAG}[{{"version": "v0.9", "updateComponents":'
      ' {"surfaceId": "s1", "root": "root", "components": [{"id": "root",'
      f' "component": "Text", "text": "block2"}}]}}}}]}}] {A2UI_CLOSE_TAG} trailing'
      " text"
  )
  response_parts = parser.process_chunk(chunk2)
  assert len(response_parts) == 2
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [{
              "id": "root",
              "component": "Text",
              "text": "block2",
          }],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)
  assertResponseContainsText(response_parts, " more text ")
  assertResponseContainsText(response_parts, " trailing text")


def test_partial_json_and_incremental_yielding(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Open A2UI block
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # 2. Send a partial component in a updateComponents
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": "hello'
  )
  # The JSON fixer should close the quotes, braces, and brackets
  response_parts = parser.process_chunk(chunk1)

  # Should yield the partial root component
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [{
              "id": "root",
              "component": "Text",
              "text": "hello",
          }],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_single_child_string(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # Send a container with a single string child, but we haven't seen the child yet (e.g. Card with child)
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Card", "child": "c1"}'
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "loading_c1",
                  **parser._placeholder_component,
              },
              {
                  "id": "root",
                  "component": "Card",
                  "child": "loading_c1",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  # Send the child component
  chunk2 = ', {"id": "c1", "component": "Text", "text": "child 1"}]}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "Card",
                  "child": "c1",
              },
              {
                  "id": "c1",
                  "component": "Text",
                  "text": "child 1",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_template_componentId(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # Send a container with a template, but we haven't seen the template component yet
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "List", "children": {"componentId":'
      ' "c1"'
  )
  response_parts = parser.process_chunk(chunk1)
  # No complete object is yielded due to missing path
  expected = []
  assertResponseContainsMessages(response_parts, expected)

  # Send the path to complete the template, and the template component
  chunk2 = ', "path": "/items"'
  response_parts = parser.process_chunk(chunk2)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "List",
                  "children": {"componentId": "loading_c1", "path": "/items"},
              },
              {
                  "id": "loading_c1",
                  **parser._placeholder_component,
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  chunk3 = (
      '}}, {"id": "c1", "component": "Text", "text": "child 1"}]}} ' + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk3)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "root",
          "components": [
              {
                  "id": "root",
                  "component": "List",
                  "children": {"componentId": "c1", "path": "/items"},
              },
              {
                  "id": "c1",
                  "component": "Text",
                  "text": "child 1",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_children_lists(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # Send a container with 3 children, but we've only "seen" the first one
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Container", "children": ["c1",'
      ' "c2", "c3"]}'
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [
                  {
                      "id": "loading_c1",
                      **parser._placeholder_component,
                  },
                  {
                      "id": "loading_c2",
                      **parser._placeholder_component,
                  },
                  {
                      "id": "loading_c3",
                      **parser._placeholder_component,
                  },
                  {
                      "id": "root",
                      "component": "Container",
                      "children": ["loading_c1", "loading_c2", "loading_c3"],
                  },
              ],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  chunk2 = ', {"id": "c1", "component": "Text", "text": "child 1"}]}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [
                  {
                      "id": "loading_c2",
                      **parser._placeholder_component,
                  },
                  {
                      "id": "loading_c3",
                      **parser._placeholder_component,
                  },
                  {
                      "id": "root",
                      "component": "Container",
                      "children": ["c1", "loading_c2", "loading_c3"],
                  },
                  {
                      "id": "c1",
                      "component": "Text",
                      "text": "child 1",
                  },
              ],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_data_model_before_components(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. Data model comes BEFORE components
  chunk1 = (
      '{"version": "v0.9", "updateDataModel": {"surfaceId": "s1", "value": {"name":'
      ' "Alice"}}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "s1",
              "value": {"name": "Alice"},
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 2. createSurface
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}, '
  )
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "s1"},
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Component with path
  chunk2 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": {"path":'
      ' "/name"}}]}}]'
      + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": {"path": "/name"},
              }],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_data_model_after_components(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}, '
  )

  # 1. Component arrives first
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": {"path":'
      ' "/name"}}]}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": {"path": "/name"},
              }],
          },
      },
  ]

  assertResponseContainsMessages(response_parts, expected)

  # 2. Send data model update
  chunk2 = (
      '{"version": "v0.9", "updateDataModel": {"surfaceId": "s1", "value": {"name":'
      ' "Alice"}}}]'
      + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "s1",
              "value": {"name": "Alice"},
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_paths(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}, '
  )

  # Partial path arrives
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": {"path": "/loca'
  )
  response_parts = parser.process_chunk(chunk1)
  assert len(response_parts) == 0

  # Complete the path
  chunk2 = 'tion"}]}}]' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": {"path": "/location"},
              }],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_cut_atomic_id(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # Atomic key component `surfaceId` is cut. Complete it in the next chunk.
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "contact'
  )
  assert len(response_parts) == 0

  # Should have createSurface only
  response_parts = parser.process_chunk(
      '-card"}}, {"version": "v0.9", "updateComponents": {"surfaceId": "contact-card",'
      ' "root": "root", "components": [{"id": "button'
  )
  assert len(response_parts) == 1
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "contact-card"},
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  response_parts = parser.process_chunk('-text"')
  # Waiting for the component definition to complete
  assert len(response_parts) == 0

  # 3. Complete the component AND make it reachable from root
  response_parts = parser.process_chunk(
      ', "component": "Text", "text": "hi"}, {"id": "root", "component":'
      ' "Card", "child": "button-text"}]}}]'
      + A2UI_CLOSE_TAG
  )
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "contact-card",
              "root": "root",
              "components": [
                  {"id": "button-text", "component": "Text", "text": "hi"},
                  {"id": "root", "component": "Card", "child": "button-text"},
              ],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_cut_cuttable_text(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}, '
  )

  # Cuttable key 'text' is cut
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": "Em'
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": "Em",
              }],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Complete the text
  chunk2 = 'ail"}]}}]' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": "Email",
              }],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_message_ordering_buffering(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. updateComponents arrives BEFORE createSurface
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": "hi"}]}}, '
  )
  response_parts = parser.process_chunk(chunk1)

  # Should yield nothing yet as createSurface is missing
  assert len(response_parts) == 0

  # 2. createSurface arrives
  chunk2 = (
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}]'
      + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk2)

  # Should now yield createSurface AND the buffered updateComponents
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "s1"},
      },
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{"id": "root", "component": "Text", "text": "hi"}],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_delete_surface_buffering(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # deleteSurface before createSurface -> should be ignored
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "deleteSurface": {"surfaceId": "s1"}}, '
  )
  assert len(response_parts) == 0

  # createSurface for s1 -> creating a new surface
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}]'
  )
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "s1"},
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_cut_path(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}, '
  )

  # "path" is non-cuttable, so this should not yield until closing quote
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Text", "text": {"path": "/user'
  )
  response_parts = parser.process_chunk(chunk1)
  # Awaiting for the closing quote of "path"
  assert len(response_parts) == 0

  # Now close it
  chunk2 = '/profile"}}}}]}]' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk2)

  # Should now have the placeholder with full path
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [
                  {
                      "id": "root",
                      "component": "Text",
                      "text": {"path": "/user/profile"},
                  },
              ],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_strict_begin_rendering_validation(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(A2UI_OPEN_TAG + "[")

  # 1. Totally invalid message (v0.8)
  chunk = '{"unknownMessage": "invalid"}]'
  with pytest.raises(ValueError, match="Validation failed"):
    parser.process_chunk(chunk)


def test_yield_validation_failure(mock_catalog):
  # Setup a more strict schema for Text component
  mock_catalog.catalog_schema[CATALOG_COMPONENTS_KEY]["Text"]["required"] = ["text"]
  parser = A2uiStreamParser(catalog=mock_catalog)

  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}}, '
  )

  # Send an invalid message (missing required field inside envelope)
  chunk = '{"updateComponents": {"components": []}}'

  with pytest.raises(ValueError, match="Validation failed"):
    parser.process_chunk(chunk)


def test_delta_streaming_correctness(mock_catalog):
  """Verifies that the parser correctly assembles components from small deltas."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Start with open tag
  parser.process_chunk(A2UI_OPEN_TAG)
  response_parts = parser.process_chunk("[")
  assert response_parts == []

  # 2. Stream createSurface char by char
  v09_json = (
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}'
  )
  for char in v09_json[:-1]:
    response_parts = parser.process_chunk(char)
    assert response_parts == []

  response_parts = parser.process_chunk(v09_json[-1])
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "s1"},
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Stream updateComponents with component splitting across deltas
  response_parts = parser.process_chunk(
      ', {"updateComponents": {"surfaceId": "s1", "components": ['
  )
  assert response_parts == []
  response_parts = parser.process_chunk('{"id": "root", "compon')
  assert response_parts == []

  # The parser is eager and yields immediately because 'text' is in CUTTABLE_KEYS
  response_parts = parser.process_chunk('ent": "Text", "text": "hello')

  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": "hello",
              }],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Stream the rest of the text
  response_parts = parser.process_chunk(" world")
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [{
                  "id": "root",
                  "component": "Text",
                  "text": "hello world",
              }],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_multiple_re_yielding_scenarios(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "s1"}}, '
  )

  # 1. Component with 2 paths
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "components":'
      ' [{"id": "root", "component": "Container", "children": ["c1", "c2"]}, {"id":'
      ' "c1", "component": "Text", "text": {"path": "/p1"}}, {"id": "c2", "component":'
      ' "Text", "text": {"path": "/p2"}}]}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [
                  {
                      "id": "c1",
                      "component": "Text",
                      "text": {"path": "/p1"},
                  },
                  {
                      "id": "c2",
                      "component": "Text",
                      "text": {"path": "/p2"},
                  },
                  {
                      "id": "root",
                      "component": "Container",
                      "children": ["c1", "c2"],
                  },
              ],
          },
      },
  ]

  assertResponseContainsMessages(response_parts, expected)

  # 2. Add p1
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "updateDataModel": {"surfaceId": "s1", "value": {"p1":'
      ' "v1"}}}, '
  )
  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "s1",
              "value": {"p1": "v1"},
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Add p2
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "updateDataModel": {"surfaceId": "s1", "value": {"p2":'
      ' "v2"}}}'
  )

  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "s1",
              "value": {"p2": "v2"},
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_incremental_data_model_streaming(mock_catalog):
  """Verifies that the parser yields surface updates as items arrive in a updateDataModel stream."""
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. Establish surface
  parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"catalogId": "test_catalog", "surfaceId":'
      ' "default"}}, '
  )

  # 2. Establish surface components with a data binding
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "default", "root":'
      ' "item-list", "components": [{"id": "item-list", "component": "List",'
      ' "children": {"componentId": "template-name", "path": "/items"}}, {"id":'
      ' "template-name", "component": "Text", "text": {"path": "/name"}}]}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "default",
          "root": "item-list",
          "components": [
              {
                  "id": "item-list",
                  "component": "List",
                  "children": {
                      "componentId": "template-name",
                      "path": "/items",
                  },
              },
              {
                  "id": "template-name",
                  "component": "Text",
                  "text": {"path": "/name"},
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Start streaming updateDataModel
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value":'
      ' {"items": {'
  )
  # The parser yields the data model early once it sniffs the start of it
  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "default",
              "value": {"items": {}},
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Add Item 1
  response_parts = parser.process_chunk('"item1": {"name": "Item 1"}, ')
  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "default",
              "value": {
                  "items": {"item1": {"name": "Item 1"}},
              },
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Add Item 2
  response_parts = parser.process_chunk(
      '"item2": {"name": "Item 2"}}}}}] ' + A2UI_CLOSE_TAG
  )
  expected = [
      {
          "version": "v0.9",
          "updateDataModel": {
              "surfaceId": "default",
              "value": {
                  "items": {
                      "item1": {"name": "Item 1"},
                      "item2": {"name": "Item 2"},
                  },
              },
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_invalid_datamodel_fails_gracefully(mock_catalog):
  """Verifies that sniffing a partial DM update that would fail validation doesn't crash."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Provide a partial chunk where the LAST item in value is incomplete
  chunk = (
      '[ {"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value": '
      '{"name": "John", "incomplete": '
  )

  response_parts = parser.process_chunk(A2UI_OPEN_TAG + chunk)
  # Should yield only the FIRST valid entry (name: John)
  expected = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {"name": "John"},
      },
  }]
  assertResponseContainsMessages(response_parts, expected)

  # 2. Provide a chunk that is COMPLETELY invalid (missing value on only entry)
  chunk2 = (
      A2UI_OPEN_TAG
      + '{"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value":'
      ' {"unnamed":'
  )
  response_parts = parser.process_chunk(chunk2)
  assert response_parts == []


def test_sniff_partial_datamodel_with_cut_key(mock_catalog):
  """Verifies that an unclosed string like {"key or {"key": "val still yields previous valid entries."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Chunk ending with an open key name
  chunk1 = (
      A2UI_OPEN_TAG
      + '[ {"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value": '
      '{"infoLink": "[More Info](x)", "rat'
  )
  response_parts = parser.process_chunk(chunk1)

  expected1 = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {"infoLink": "[More Info](x)"},
      },
  }]
  assertResponseContainsMessages(response_parts, expected1)

  # Chunk completing the key and value
  chunk2 = 'ing": "5 star"'
  response_parts = parser.process_chunk(chunk2)
  expected2 = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {"rating": "5 star"},
      },
  }]
  assertResponseContainsMessages(response_parts, expected2)

  # Chunk ending inside a string value that IS NOT cuttable due to URL heuristics
  chunk3_url = ', "imageUrl": "http://localhost:10002/static/map'
  response_parts = parser.process_chunk(chunk3_url)
  # Should yield nothing because imageUrl is incomplete
  assert response_parts == []

  # Finish the chunk
  chunk4 = 's.png"}}] ' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk4)
  expected4 = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {
              "imageUrl": "http://localhost:10002/static/maps.png",
          },
      },
  }]
  assertResponseContainsMessages(response_parts, expected4)


def test_sniff_partial_datamodel_cumulative_unmodified_keys(mock_catalog):
  """Verifies that unchanged keys are retained in partial updateDataModels."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Chunk 1: 'title' is complete, 'items' is unclosed
  chunk1 = (
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value":'
      ' {"title": "Top Restaurants", "items": {'
  )

  response_parts = parser.process_chunk(chunk1)

  expected1 = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {
              "title": "Top Restaurants",
              "items": {},
          },
      },
  }]
  assertResponseContainsMessages(response_parts, expected1)

  # Chunk 2: 'items' gets populated with nested object
  chunk2 = '"item1": {"name": "Restaurant A"}'
  response_parts = parser.process_chunk(chunk2)

  expected2 = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {
              "items": {"item1": {"name": "Restaurant A"}},
          },
      },
  }]
  assertResponseContainsMessages(response_parts, expected2)


def test_sniff_partial_datamodel_prunes_empty_keys(mock_catalog):
  """Verifies that entries with only a key and no value are pruned from partial updateDataModels."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[ {"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value": {'
      + '"title": "Top Restaurants",'
      + '"items": {"item1": {"name": "Food", "detail": "Spicy", "imageUrl":'
  )
  response_parts = parser.process_chunk(chunk)

  # Should yield title, name, detail, but NOT imageUrl because it is incomplete
  expected = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {
              "title": "Top Restaurants",
              "items": {
                  "item1": {
                      "name": "Food",
                      "detail": "Spicy",
                  }
              },
          },
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_datamodel_prunes_empty_trailing_dict(mock_catalog):
  """Verifies that an incomplete trailing empty dictionary '{}' is dropped."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[ {"version": "v0.9", "updateDataModel": {"surfaceId": "default", "value": {'
      + '"title": "Top Restaurants",'
      + '"items": {"item2": {"name": "Han Dynasty", "imageUrl":'
      ' "http://localhost:10002/static/mapotofu.jpeg", "broken":'
  )
  response_parts = parser.process_chunk(chunk)

  expected = [{
      "version": "v0.9",
      "updateDataModel": {
          "surfaceId": "default",
          "value": {
              "title": "Top Restaurants",
              "items": {
                  "item2": {
                      "name": "Han Dynasty",
                      "imageUrl": "http://localhost:10002/static/mapotofu.jpeg",
                  }
              },
          },
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_component_discards_empty_children_dict(mock_catalog):
  """Verifies that an incomplete component with an empty children dictionary is discarded until populated."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "default"}},'
      + '{"version": "v0.9", "updateComponents": {"surfaceId": "default", "root":'
      ' "root-column", "components": ['
      + '{"id": "root-column", "component": "Column", "children": ["item-list"]},'
      + '{"id": "item-list", "component": "List", "direction": "vertical",'
      ' "children": {'
  )

  response_parts = parser.process_chunk(chunk)

  # item-list has {"children": {}}. It should be completely discarded from _seen_components.
  # Its parent, root-column, will then replace the missing item-list with a loading placeholder.
  expected = [
      {
          "version": "v0.9",
          "createSurface": {"catalogId": "test_catalog", "surfaceId": "default"},
      },
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "default",
              "root": "root-column",
              "components": [
                  {
                      "id": "loading_item-list",
                      "component": "Row",
                      "children": [],
                  },
                  {
                      "id": "root-column",
                      "component": "Column",
                      "children": ["loading_item-list"],
                  },
              ],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_empty_dict_discarded(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  # Send a component with an empty dictionary that will be closed by the fixer
  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "root",'
      ' "components": [{"id": "root", "component": "Column", "children": {'
  )
  response_parts = parser.process_chunk(chunk1)
  assertResponseContainsNoA2UI(response_parts)

  chunk2 = (
      '"componentId": "c1", "path": "/items"}}, {"id": "c1", "component": "Text",'
      ' "text": "Child 1"}]}} '
      + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk2)

  expected = [
      {
          "version": "v0.9",
          "updateComponents": {
              "surfaceId": "s1",
              "root": "root",
              "components": [
                  {
                      "id": "c1",
                      "component": "Text",
                      "text": "Child 1",
                  },
                  {
                      "id": "root",
                      "component": "Column",
                      "children": {"componentId": "c1", "path": "/items"},
                  },
              ],
          },
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_component_enforces_required_fields(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(
      A2UI_OPEN_TAG
      + '[{"version": "v0.9", "createSurface": {"catalogId": "test_catalog",'
      ' "surfaceId": "s1"}},'
  )

  chunk1 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "s1", "root": "c1",'
      ' "components": [{"id": "c1", "component": "AudioPlayer", "description": "almost'
      ' ready"'
  )
  response_parts = parser.process_chunk(chunk1)
  assertResponseContainsNoA2UI(response_parts)

  chunk2 = ', "url": "http://audio.mp3"}]}} ' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk2)

  expected = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "s1",
          "root": "c1",
          "components": [{
              "id": "c1",
              "component": "AudioPlayer",
              "description": "almost ready",
              "url": "http://audio.mp3",
          }],
      },
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_multiple_concurrent_surfaces(mock_catalog):
  """Verifies that the parser can handle multiple surfaces simultaneously."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Send A2UI block opening bracket
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. Establish root for surface 1
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"surfaceId": "surface1", "catalogId":'
      ' "test_catalog"}},'
  )
  expected_cs1 = [{
      "version": "v0.9",
      "createSurface": {"catalogId": "test_catalog", "surfaceId": "surface1"},
  }]
  assertResponseContainsMessages(response_parts, expected_cs1)

  # 2. Establish root for surface 2
  response_parts = parser.process_chunk(
      '{"version": "v0.9", "createSurface": {"surfaceId": "surface2", "catalogId":'
      ' "test_catalog"}},'
  )
  expected_cs2 = [{
      "version": "v0.9",
      "createSurface": {"catalogId": "test_catalog", "surfaceId": "surface2"},
  }]
  assertResponseContainsMessages(response_parts, expected_cs2)

  # 3. Stream components for surface 1 in chunks
  chunk_s1_a = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "surface1", "root":'
      ' "root1", "components": [{"id": "root1", "component": "Card", "child": "c1"}, '
  )
  response_parts = parser.process_chunk(chunk_s1_a)
  expected_s1_a = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "surface1",
          "root": "root1",
          "components": [
              {
                  **parser._placeholder_component,
                  "id": "loading_c1",
              },
              {"id": "root1", "component": "Card", "child": "loading_c1"},
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected_s1_a)

  chunk_s1_b = '{"id": "c1", "component": "Text", "text": "hello s1"}]}}, '
  response_parts = parser.process_chunk(chunk_s1_b)

  expected_s1_b = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "surface1",
          "root": "root1",
          "components": [
              {
                  "id": "c1",
                  "component": "Text",
                  "text": "hello s1",
              },
              {
                  "id": "root1",
                  "component": "Card",
                  "child": "c1",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected_s1_b)

  # 4. Stream components for surface 2
  chunk_s2 = (
      '{"version": "v0.9", "updateComponents": {"surfaceId": "surface2", "root":'
      ' "root2", "components": [{"id": "root2", "component": "Card", "child": "c2"},'
      ' {"id": "c2", "component": "Text", "text": "hello s2"}]}}'
  )
  response_parts = parser.process_chunk(chunk_s2)

  expected_s2 = [{
      "version": "v0.9",
      "updateComponents": {
          "surfaceId": "surface2",
          "root": "root2",
          "components": [
              {
                  "id": "c2",
                  "component": "Text",
                  "text": "hello s2",
              },
              {
                  "id": "root2",
                  "component": "Card",
                  "child": "c2",
              },
          ],
      },
  }]
  assertResponseContainsMessages(response_parts, expected_s2)

  # Send A2UI block closing bracket
  parser.process_chunk(f"]{A2UI_CLOSE_TAG}")
