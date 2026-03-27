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
    VERSION_0_8,
    SURFACE_ID_KEY,
    CATALOG_COMPONENTS_KEY,
)
from a2ui.core.parser.constants import (
    MSG_TYPE_SURFACE_UPDATE,
    MSG_TYPE_BEGIN_RENDERING,
    MSG_TYPE_DELETE_SURFACE,
    MSG_TYPE_DATA_MODEL_UPDATE,
)
from a2ui.core.schema.catalog import A2uiCatalog
from a2ui.core.parser.streaming import A2uiStreamParser, PLACEHOLDER_COMPONENT
from a2ui.core.parser.response_part import ResponsePart


@pytest.fixture
def mock_catalog():
  s2c_schema = {
      "title": "A2UI Message Schema",
      "type": "object",
      "additionalProperties": False,
      "properties": {
          "beginRendering": {
              "type": "object",
              "properties": {
                  "surfaceId": {"type": "string"},
                  "root": {"type": "string"},
              },
              "required": ["surfaceId", "root"],
          },
          "surfaceUpdate": {
              "type": "object",
              "properties": {
                  "surfaceId": {
                      "type": "string",
                  },
                  "components": {
                      "type": "array",
                      "items": {
                          "type": "object",
                          "properties": {
                              "id": {
                                  "type": "string",
                              },
                              "component": {
                                  "type": "object",
                                  "additionalProperties": True,
                              },
                          },
                          "required": ["id", "component"],
                      },
                  },
              },
              "required": ["surfaceId", "components"],
          },
          "dataModelUpdate": {
              "type": "object",
              "properties": {
                  "surfaceId": {"type": "string"},
                  "contents": {
                      "type": "array",
                      "items": {
                          "type": "object",
                          "properties": {
                              "key": {"type": "string"},
                              "valueString": {"type": "string"},
                              "valueNumber": {"type": "number"},
                              "valueBoolean": {"type": "boolean"},
                              "valueMap": {
                                  "type": "array",
                                  "items": {
                                      "type": "object",
                                      "properties": {
                                          "key": {"type": "string"},
                                          "valueString": {"type": "string"},
                                          "valueNumber": {"type": "number"},
                                          "valueBoolean": {"type": "boolean"},
                                      },
                                      "required": ["key"],
                                  },
                              },
                          },
                          "required": ["key"],
                      },
                  },
              },
              "required": ["surfaceId", "contents"],
          },
          "deleteSurface": {
              "type": "object",
              "properties": {
                  "surfaceId": {
                      "type": "string",
                  }
              },
              "required": ["surfaceId"],
          },
      },
  }
  catalog_schema = {
      "catalogId": "test_catalog",
      "components": {
          "Container": {
              "type": "object",
              "properties": {
                  "children": {
                      "type": "array",
                      "items": {"type": "string", "title": "ComponentId"},
                  }
              },
              "additionalProperties": True,
          },
          "Card": {
              "type": "object",
              "properties": {
                  "child": {"type": "string", "title": "ComponentId"},
                  "children": {
                      "type": "array",
                      "items": {"type": "string", "title": "ComponentId"},
                  },
              },
              "additionalProperties": True,
          },
          "Text": {"type": "object", "additionalProperties": True},
          "Loading": {"type": "object", "additionalProperties": True},
          "List": {"type": "object", "additionalProperties": True},
          "Row": {
              "type": "object",
              "properties": {
                  "children": {
                      "type": "object",
                      "properties": {
                          "explicitList": {
                              "type": "array",
                              "items": {"type": "string"},
                          },
                          "required": ["componentId", "dataBinding"],
                      },
                  }
              },
              "required": ["children"],
          },
          "Column": {
              "type": "object",
              "properties": {
                  "children": {
                      "type": "object",
                      "properties": {
                          "explicitList": {
                              "type": "array",
                              "items": {"type": "string", "title": "ComponentId"},
                          }
                      },
                  }
              },
          },
          "AudioPlayer": {
              "type": "object",
              "properties": {
                  "url": {
                      "type": "object",
                      "properties": {
                          "literalString": {"type": "string"},
                          "path": {"type": "string"},
                      },
                  },
              },
              "required": ["url"],
          },
      },
  }
  common_types_schema = {
      "$id": "https://a2ui.org/specification/v0_8/common_types.json",
      "type": "object",
      "$defs": {},
  }
  return A2uiCatalog(
      version=VERSION_0_8,
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
    if MSG_TYPE_SURFACE_UPDATE in msg:
      payload = msg[MSG_TYPE_SURFACE_UPDATE]
      if CATALOG_COMPONENTS_KEY in payload:
        payload[CATALOG_COMPONENTS_KEY].sort(key=lambda x: x.get("id", ""))
    elif "updateComponents" in msg:
      payload = msg["updateComponents"]
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


def test_incremental_yielding_v08(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Begin rendering establishes the root but is buffered
  chunk1 = "Here is your"
  chunk2 = f" response.{A2UI_OPEN_TAG}["
  chunk3 = '{"beginRendering": {"surfaceId": "s1", "root":'
  chunk4 = ' "root'
  chunk5 = '-column"'
  chunk6 = "}},"

  # No A2UI messages yet
  response_parts = parser.process_chunk(chunk1)
  assertResponseContainsText(response_parts, "Here is your")
  assertResponseContainsNoA2UI(response_parts)

  # No A2UI messages yet
  response_parts = parser.process_chunk(chunk2)
  assertResponseContainsText(response_parts, " response.")
  assertResponseContainsNoA2UI(response_parts)

  # There is a beginRendering message, but no root is found.
  response_parts = parser.process_chunk(chunk3)
  assert len(response_parts) == 0
  assertResponseContainsNoA2UI(response_parts)

  # Root is not closing
  response_parts = parser.process_chunk(chunk4)
  assert len(response_parts) == 0
  assertResponseContainsNoA2UI(response_parts)

  # BeginRendering should not be yielded yet.
  response_parts = parser.process_chunk(chunk5)
  assertResponseContainsNoA2UI(response_parts)

  # Receive final closing brace -> beginRendering is complete
  response_parts = parser.process_chunk(chunk6)
  expected = [
      {
          "beginRendering": {"surfaceId": "s1", "root": "root-column"},
      },
  ]
  assert len(response_parts) == 1
  assert response_parts[0].a2ui_json == expected

  # 2. Add root component
  surface_chunk_1 = '{"surfaceUpdate": {"surfaceId": "s'
  surface_chunk_2 = '1", "components": ['
  surface_chunk_3 = '{"id": "root-'
  surface_chunk_4 = 'column", "component":'
  surface_chunk_5 = ' {"Column": {"children": {"expli'
  surface_chunk_6 = 'citList": ['
  surface_chunk_7 = '"c1",'
  surface_chunk_8 = '"c2",'
  surface_chunk_9 = "]}}}}"

  # Awaiting for complete surfaceId
  response_parts = parser.process_chunk(surface_chunk_1)
  assertResponseContainsNoA2UI(response_parts)
  # Awaiting for components
  response_parts = parser.process_chunk(surface_chunk_2)
  assertResponseContainsNoA2UI(response_parts)
  # Awaiting for root component
  response_parts = parser.process_chunk(surface_chunk_3)
  assertResponseContainsNoA2UI(response_parts)
  # Awaiting for component layout
  response_parts = parser.process_chunk(surface_chunk_4)
  assertResponseContainsNoA2UI(response_parts)
  # Chunk 5 only knows it's a Column with children, but not the type of children.
  # So it should be empty for now.
  response_parts = parser.process_chunk(surface_chunk_5)
  assertResponseContainsNoA2UI(response_parts)

  # Chunk 6 sees `"explicitList": [` - now it knows it's a list.
  response_parts = parser.process_chunk(surface_chunk_6)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root-column",
                  "component": {
                      "Column": {
                          "children": {"explicitList": ["loading_children_root-column"]}
                      }
                  },
              },
              {
                  "id": "loading_children_root-column",
                  "component": PLACEHOLDER_COMPONENT,
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  # Loading c1
  response_parts = parser.process_chunk(surface_chunk_7)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root-column",
                  "component": {
                      "Column": {"children": {"explicitList": ["loading_c1"]}}
                  },
              },
              {
                  "id": "loading_c1",
                  "component": PLACEHOLDER_COMPONENT,
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  # Loading c2
  response_parts = parser.process_chunk(surface_chunk_8)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root-column",
                  "component": {
                      "Column": {
                          "children": {"explicitList": ["loading_c1", "loading_c2"]}
                      }
                  },
              },
              {
                  "id": "loading_c1",
                  "component": PLACEHOLDER_COMPONENT,
              },
              {
                  "id": "loading_c2",
                  "component": PLACEHOLDER_COMPONENT,
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  response_parts = parser.process_chunk(surface_chunk_9)
  # Chunk 9 carries no new component data, so it should be empty due to deduplication.
  assertResponseContainsNoA2UI(response_parts)

  # 3. Add child components
  c1_chunk = (
      '{"id": "c1", "component": {"Text": {"text": {"literalString": "hello"}}}}}'
  )
  c2_chunk = (
      '{"id": "c2", "component": {"Text": {"text": {"literalString": "world"}}}}}'
  )
  response_parts = parser.process_chunk(c1_chunk)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root-column",
                  "component": {
                      "Column": {"children": {"explicitList": ["c1", "loading_c2"]}}
                  },
              },
              {
                  "id": "c1",
                  "component": {
                      "Text": {
                          "text": {"literalString": "hello"},
                      }
                  },
              },
              {
                  "id": "loading_c2",
                  "component": PLACEHOLDER_COMPONENT,
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  response_parts = parser.process_chunk(c2_chunk)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root-column",
                  "component": {"Column": {"children": {"explicitList": ["c1", "c2"]}}},
              },
              {
                  "id": "c1",
                  "component": {
                      "Text": {
                          "text": {"literalString": "hello"},
                      }
                  },
              },
              {
                  "id": "c2",
                  "component": {
                      "Text": {
                          "text": {"literalString": "world"},
                      }
                  },
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_waiting_for_root_component(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}},'
  )

  # Send a non-root component but keep the surfaceUpdate message open
  chunk = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "c1", "component":'
      ' {"Text": {"text": {"literalString": "hello"}}}}'
  )
  response_parts = parser.process_chunk(chunk)
  # Should not yield anything because no reachable components from root yet
  assertResponseContainsNoA2UI(response_parts)

  # Now send the root and close the surfaceUpdate message
  chunk_root = (
      ', {"id": "root", "component": {"Card": {"child": "c1"}}}]}'
      f" {A2UI_CLOSE_TAG}"
  )
  response_parts = parser.process_chunk(chunk_root)
  # Should yield beginRendering and the surfaceUpdate with both components
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "c1",
                  "component": {
                      "Text": {
                          "text": {"literalString": "hello"},
                      }
                  },
              },
              {
                  "id": "root",
                  "component": {"Card": {"child": "c1"}},
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_complete_surface_ignore_orphan_component(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}}, '
  parser.process_chunk(chunk)

  chunk += (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": ['
      '{"id": "root", "component": {"Text": {"text": "root"}}}, '
      '{"id": "orphan", "component": {"Text": {"text": "orphan"}}}'
      "]}}] "
  )
  chunk += A2UI_CLOSE_TAG

  response_parts = parser.process_chunk(chunk)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root",
                  "component": {
                      "Text": {
                          "text": "root",
                      }
                  },
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_circular_reference_detection(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "c1", "surfaceId": "s1"}},'
  )

  # c1 -> c2
  parser.process_chunk(
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "c1", "component":'
      ' {"Card": {"child": "c2"}}}]}},'
  )

  # c2 -> c1 (Cycle!)
  with pytest.raises(ValueError, match="Circular reference detected"):
    parser.process_chunk(
        '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "c2",'
        f' "component": {{"Card": {{"child": "c1"}}}}}}]}}]}} {A2UI_CLOSE_TAG}'
    )


def test_self_reference_detection(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "c1", "surfaceId": "s1"}},'
  )

  # c1 -> c1 (Self-reference!)
  with pytest.raises(ValueError, match="Self-reference detected"):
    parser.process_chunk(
        '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "c1",'
        f' "component": {{"Card": {{"child": "c1"}}}}}}]}}]}} {A2UI_CLOSE_TAG}'
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
      '[{"beginRendering": {"root": "root", "surfaceId": "s1"}}]'
  )
  assert any(
      m.a2ui_json
      and (
          any(MSG_TYPE_BEGIN_RENDERING in msg for msg in m.a2ui_json)
          if isinstance(m.a2ui_json, list)
          else MSG_TYPE_BEGIN_RENDERING in m.a2ui_json
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
      f'[{{"beginRendering": {{"root": "r", "surfaceId": "s"}}}}] {A2UI_CLOSE_TAG} End.'
  )
  texts = [m.text for m in messages if m.text]
  assert " End." in texts


def test_only_begin_rendering(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  response_parts = parser.process_chunk(A2UI_OPEN_TAG)
  assert response_parts == []

  response_parts = parser.process_chunk("[")
  assert response_parts == []

  chunk = (
      '{"beginRendering": {"root": "root", "surfaceId": "s1", "styles":'
      ' {"primaryColor": "#FF0000",'
  )
  response_parts = parser.process_chunk(chunk)
  # beginRendering is not yielded until the entire message is received
  assert response_parts == []

  response_parts = parser.process_chunk('"font": "Roboto"}')  # closing styles
  assert response_parts == []

  response_parts = parser.process_chunk("}")  # closing beginRendering
  assert response_parts == []

  response_parts = parser.process_chunk("}")  # closing the item in the list
  expected = [
      {
          "beginRendering": {
              "root": "root",
              "surfaceId": "s1",
              "styles": {"primaryColor": "#FF0000", "font": "Roboto"},
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_add_msg_type_deduplication():
  parser = A2uiStreamParser()
  parser.add_msg_type(MSG_TYPE_SURFACE_UPDATE)
  parser.add_msg_type(MSG_TYPE_SURFACE_UPDATE)
  assert parser.msg_types == [MSG_TYPE_SURFACE_UPDATE]

  parser.add_msg_type(MSG_TYPE_BEGIN_RENDERING)
  assert parser.msg_types == [MSG_TYPE_SURFACE_UPDATE, MSG_TYPE_BEGIN_RENDERING]
  parser.add_msg_type(MSG_TYPE_SURFACE_UPDATE)
  assert parser.msg_types == [MSG_TYPE_SURFACE_UPDATE, MSG_TYPE_BEGIN_RENDERING]


def test_streaming_msg_type_deduplication(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  # 1. Send partial chunk that triggers sniffing
  chunk1 = A2UI_OPEN_TAG + '[{"surfaceUpdate": {"surfaceId": "s1", "components": ['
  parser.process_chunk(chunk1)

  # Sniffing should have added surfaceUpdate
  assert MSG_TYPE_SURFACE_UPDATE in parser.msg_types
  assert parser.msg_types.count(MSG_TYPE_SURFACE_UPDATE) == 1

  # 2. Send the rest, which triggers handle_complete_object
  chunk2 = (
      '{"id": "root", "component": {"Text": {"text": "hi"}}}]}]'
      f" {A2UI_CLOSE_TAG}"
  )
  parser.process_chunk(chunk2)

  # After completion, msg_types is reset
  assert parser.msg_types == []


def test_multiple_a2ui_blocks(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Block 1: beginRendering
  chunk1 = (
      f'Some text here {A2UI_OPEN_TAG}[{{"beginRendering": {{"root": "root",'
      f' "surfaceId": "s1"}}}}] {A2UI_CLOSE_TAG} mid text'
  )
  response_parts = parser.process_chunk(chunk1)
  assert len(response_parts) == 2
  expected = [
      {"beginRendering": {"root": "root", "surfaceId": "s1"}},
  ]
  assertResponseContainsMessages(response_parts, expected)
  assertResponseContainsText(response_parts, "Some text here ")
  assertResponseContainsText(response_parts, " mid text")

  # Block 2: surfaceUpdate
  chunk2 = (
      f' more text {A2UI_OPEN_TAG}[{{"surfaceUpdate": {{"surfaceId": "s1",'
      ' "components": [{"id": "root", "component": {"Text": {"text":'
      f' "block2"}}}}}}]}}] {A2UI_CLOSE_TAG} trailing text'
  )
  response_parts = parser.process_chunk(chunk2)
  assert len(response_parts) == 2
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [{
              "id": "root",
              "component": {
                  "Text": {
                      "text": "block2",
                  }
              },
          }],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)
  assertResponseContainsText(response_parts, " more text ")
  assertResponseContainsText(response_parts, " trailing text")


def test_partial_json_and_incremental_yielding(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Open A2UI block
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}},'
  )

  # 2. Send a partial component in a surfaceUpdate
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": "hello'
  )
  # The JSON fixer should close the quotes, braces, and brackets
  response_parts = parser.process_chunk(chunk1)

  # Should yield the partial root component
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [{
              "id": "root",
              "component": {
                  "Text": {
                      "text": "hello",
                  }
              },
          }],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_single_child_string(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}},'
  )

  # Send a container with a single string child, but we haven't seen the child yet (e.g. Card with child)
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Card": {"child": "c1"}}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "Card": {
                              "child": "loading_c1",
                          }
                      },
                  },
                  {
                      "id": "loading_c1",
                      "component": PLACEHOLDER_COMPONENT,
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Send the child component
  chunk2 = '{"id": "c1", "component": {"Text": {"text": "child 1"}}}]}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "Card": {
                              "child": "c1",
                          }
                      },
                  },
                  {
                      "id": "c1",
                      "component": {
                          "Text": {
                              "text": "child 1",
                          }
                      },
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_template_componentId(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}},'
  )

  # Send a container with a template, but we haven't seen the template component yet
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"List": {"children": {"template": {"componentId": "c1"}}}}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "List": {
                              "children": {"template": {"componentId": "loading_c1"}},
                          }
                      },
                  },
                  {
                      "id": "loading_c1",
                      "component": PLACEHOLDER_COMPONENT,
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Send the child component
  chunk2 = '{"id": "c1", "component": {"Text": {"text": "child 1"}}}]}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "List": {
                              "children": {"template": {"componentId": "c1"}},
                          }
                      },
                  },
                  {
                      "id": "c1",
                      "component": {
                          "Text": {
                              "text": "child 1",
                          }
                      },
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_children_lists(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}},'
  )

  # Send a container with 3 children, but we've only "seen" the first one
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Container": {"children": ["c1", "c2", "c3"]}}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "Container": {
                              "children": ["loading_c1", "loading_c2", "loading_c3"],
                          }
                      },
                  },
                  {
                      "id": "loading_c1",
                      "component": PLACEHOLDER_COMPONENT,
                  },
                  {
                      "id": "loading_c2",
                      "component": PLACEHOLDER_COMPONENT,
                  },
                  {
                      "id": "loading_c3",
                      "component": PLACEHOLDER_COMPONENT,
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  chunk2 = '{"id": "c1", "component": {"Text": {"text": "child 1"}}}]}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "Container": {
                              "children": ["c1", "loading_c2", "loading_c3"],
                          }
                      },
                  },
                  {
                      "id": "c1",
                      "component": {
                          "Text": {
                              "text": "child 1",
                          }
                      },
                  },
                  {
                      "id": "loading_c2",
                      "component": PLACEHOLDER_COMPONENT,
                  },
                  {
                      "id": "loading_c3",
                      "component": PLACEHOLDER_COMPONENT,
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_data_model_before_components(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. Data model comes BEFORE components
  chunk1 = (
      '{"dataModelUpdate": {"surfaceId": "s1", "contents": [{"key": "name",'
      ' "valueString": "Alice"}]}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "dataModelUpdate": {
              "surfaceId": "s1",
              "contents": [{"key": "name", "valueString": "Alice"}],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 2. beginRendering
  response_parts = parser.process_chunk(
      '{"beginRendering": {"root": "root", "surfaceId": "s1"}}, '
  )
  expected = [
      {"beginRendering": {"root": "root", "surfaceId": "s1"}},
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Component with path
  chunk2 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": {"path": "/name"}}}}}}]'
      + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "root",
                  "component": {
                      "Text": {
                          "text": {"path": "/name"},
                      }
                  },
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_data_model_after_components(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk('{"beginRendering": {"root": "root", "surfaceId": "s1"}}, ')

  # 1. Component arrives first
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": {"path": "/name"}}}}}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "root",
                  "component": {
                      "Text": {
                          "text": {"path": "/name"},
                      }
                  },
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 2. Send data model update
  chunk2 = (
      '{"dataModelUpdate": {"surfaceId": "s1", "contents": [{"key": "name",'
      ' "valueString": "Alice"}]}}'
      + A2UI_CLOSE_TAG
  )
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "dataModelUpdate": {
              "surfaceId": "s1",
              "contents": [{
                  "key": "name",
                  "valueString": "Alice",
              }],
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "root",
                  "component": {
                      "Text": {
                          "text": {"path": "/name"},
                      }
                  },
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_partial_paths(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk('{"beginRendering": {"root": "root", "surfaceId": "s1"}}, ')

  # Partial path arrives
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": {"path": "/loca'
  )
  response_parts = parser.process_chunk(chunk1)
  assert len(response_parts) == 0

  # Complete the path
  chunk2 = 'tion"}}}}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [{
              "id": "root",
              "component": {
                  "Text": {
                      "text": {"path": "/location"},
                  }
              },
          }],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  # Close the overall list and tag
  response_parts = parser.process_chunk("]}]" + A2UI_CLOSE_TAG)
  assert len(response_parts) == 0


def test_url_placeholders_with_hints(mock_catalog):
  """Verifies that properties hinting at being images or links get specialized placeholders."""
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk('{"beginRendering": {"root": "root", "surfaceId": "s1"}}, ')

  # A component that contains an Image url binding and a link href binding
  chunk = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Container": {"children": ["img-comp", "link-comp"]}}},{"id": "img-comp",'
      ' "component": {"Container": {"imageUrl": {"path": "/heroImage"}}}},{"id":'
      ' "link-comp", "component": {"Card": {"href": {"path": "/docs"}}}}]}}, '
  )
  response_parts = parser.process_chunk(chunk)

  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [
              {
                  "id": "root",
                  "component": {"Container": {"children": ["img-comp", "link-comp"]}},
              },
              {
                  "id": "img-comp",
                  "component": {"Container": {"imageUrl": {"path": "/heroImage"}}},
              },
              {"id": "link-comp", "component": {"Card": {"href": {"path": "/docs"}}}},
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  parser.process_chunk("]}]" + A2UI_CLOSE_TAG)


def test_cut_atomic_id(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # Atomic key component `surfaceId` is cut. Complete it in the next chunk.
  response_parts = parser.process_chunk(
      '{"beginRendering": {"root": "root", "surfaceId": "contact'
  )
  assert len(response_parts) == 0

  # Should have beginRendering only
  response_parts = parser.process_chunk(
      '-card"}}, {"surfaceUpdate": {"surfaceId": "contact-card", "components":'
      ' [{"id": "button'
  )
  assert len(response_parts) == 1
  expected = [
      {"beginRendering": {"root": "root", "surfaceId": "contact-card"}},
  ]
  assertResponseContainsMessages(response_parts, expected)

  response_parts = parser.process_chunk('-text"')
  # Waiting for the component definition to complete
  assert len(response_parts) == 0

  # 3. Complete the component AND make it reachable from root
  response_parts = parser.process_chunk(
      ', "component": {"Text": {"text": "hi"}}}, {"id": "root", "component":'
      ' {"Card": {"child": "button-text"}}}]}}'
      + A2UI_CLOSE_TAG
  )
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "contact-card",
              "components": [
                  {"id": "button-text", "component": {"Text": {"text": "hi"}}},
                  {"id": "root", "component": {"Card": {"child": "button-text"}}},
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_cut_cuttable_text(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk('{"beginRendering": {"root": "root", "surfaceId": "s1"}}, ')

  # Cuttable key 'literalString' is cut
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": {"literalString": "Em'
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "root",
                  "component": {
                      "Text": {
                          "text": {"literalString": "Em"},
                      }
                  },
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Complete the text
  chunk2 = 'ail"}}}}]' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "root",
                  "component": {"Text": {"text": {"literalString": "Email"}}},
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_message_ordering_buffering(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. surfaceUpdate arrives BEFORE beginRendering
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": "hi"}}}]}}, '
  )
  response_parts = parser.process_chunk(chunk1)

  # Should yield nothing yet as beginRendering is missing
  assert len(response_parts) == 0

  # 2. beginRendering arrives
  chunk2 = '{"beginRendering": {"surfaceId": "s1", "root": "root"}}]' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk2)

  # Should now yield beginRendering AND the buffered surfaceUpdate
  expected = [
      {"beginRendering": {"surfaceId": "s1", "root": "root"}},
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{"id": "root", "component": {"Text": {"text": "hi"}}}],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_delete_surface_buffering(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # deleteSurface before beginRendering -> should be ignored
  response_parts = parser.process_chunk('{"deleteSurface": {"surfaceId": "s1"}}, ')
  assert len(response_parts) == 0

  # beginRendering for s1 -> creating a new surface
  response_parts = parser.process_chunk(
      '{"beginRendering": {"surfaceId": "s1", "root": "root"}}]'
  )
  expected = [
      {"beginRendering": {"surfaceId": "s1", "root": "root"}},
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_cut_path(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk('{"beginRendering": {"root": "root", "surfaceId": "s1"}}, ')

  # "path" is non-cuttable, so this should not yield until closing quote
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {"text": {"path": "/user'
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
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {"Text": {"text": {"path": "/user/profile"}}},
                  },
              ],
          }
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
      A2UI_OPEN_TAG + '[{"beginRendering": {"surfaceId": "s1", "root": "root"}}, '
  )

  # Send an invalid component (missing 'text' which is now required)
  chunk = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Text": {}}}]}}]'
  )
  with pytest.raises(ValueError, match="Validation failed"):
    parser.process_chunk(chunk)


def test_delta_streaming_correctness(mock_catalog):
  """Verifies that the parser correctly assembles components from small deltas."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Start with open tag
  parser.process_chunk(A2UI_OPEN_TAG)
  response_parts = parser.process_chunk("[")
  assert response_parts == []

  # 2. Stream beginRendering char by char
  br_json = '{"beginRendering": {"surfaceId": "s1", "root": "r1'
  for char in br_json:
    response_parts = parser.process_chunk(char)
    assert response_parts == []

  response_parts = parser.process_chunk('"')
  assert response_parts == []

  # Closing "}}" yields the complete beginRendering message on the final brace
  response_parts = parser.process_chunk("}")
  assert response_parts == []
  response_parts = parser.process_chunk("}")
  expected = [
      {"beginRendering": {"surfaceId": "s1", "root": "r1"}},
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Stream surfaceUpdate with component splitting across deltas
  response_parts = parser.process_chunk(
      ', {"surfaceUpdate": {"surfaceId": "s1", "components": ['
  )
  assert response_parts == []
  response_parts = parser.process_chunk('{"id": "r1", "compon')
  assert response_parts == []

  # The parser is eager and yields immediately because 'text' is in CUTTABLE_KEYS
  response_parts = parser.process_chunk(
      'ent": {"Text": {"text": {"literalString": "hello'
  )
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "r1",
                  "component": {
                      "Text": {
                          "text": {"literalString": "hello"},
                      }
                  },
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Stream the rest of the text
  response_parts = parser.process_chunk(" world")
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "r1",
                  "component": {
                      "Text": {
                          "text": {"literalString": "hello world"},
                      }
                  },
              }],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_multiple_re_yielding_scenarios(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")
  parser.process_chunk('{"beginRendering": {"root": "root", "surfaceId": "s1"}}, ')

  # 1. Component with 2 paths
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Container": {"children": ["c1", "c2"]}}}, {"id": "c1", "component": {"Text":'
      ' {"text": {"path": "/p1"}}}}, {"id": "c2", "component": {"Text": {"text":'
      ' {"path": "/p2"}}}}]}}, '
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "c1",
                      "component": {
                          "Text": {
                              "text": {"path": "/p1"},
                          }
                      },
                  },
                  {
                      "id": "c2",
                      "component": {
                          "Text": {
                              "text": {"path": "/p2"},
                          }
                      },
                  },
                  {
                      "id": "root",
                      "component": {
                          "Container": {
                              "children": ["c1", "c2"],
                          }
                      },
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 2. Add p1
  response_parts = parser.process_chunk(
      '{"dataModelUpdate": {"surfaceId": "s1", "contents": [{"key": "p1",'
      ' "valueString": "v1"}]}, '
  )
  expected = [
      {
          "dataModelUpdate": {
              "surfaceId": "s1",
              "contents": [{"key": "p1", "valueString": "v1"}],
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "c1",
                      "component": {
                          "Text": {
                              "text": {"path": "/p1"},
                          }
                      },
                  },
                  {
                      "id": "c2",
                      "component": {
                          "Text": {
                              "text": {"path": "/p2"},
                          }
                      },
                  },
                  {
                      "id": "root",
                      "component": {
                          "Container": {
                              "children": ["c1", "c2"],
                          }
                      },
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Add p2
  response_parts = parser.process_chunk(
      '{"dataModelUpdate": {"surfaceId": "s1", "contents": [{"key": "p2",'
      ' "valueString": "v2"}]}}'
  )
  expected = [
      {
          "dataModelUpdate": {
              "surfaceId": "s1",
              "contents": [{"key": "p2", "valueString": "v2"}],
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "c1",
                      "component": {
                          "Text": {
                              "text": {"path": "/p1"},
                          }
                      },
                  },
                  {
                      "id": "c2",
                      "component": {
                          "Text": {
                              "text": {"path": "/p2"},
                          }
                      },
                  },
                  {
                      "id": "root",
                      "component": {
                          "Container": {
                              "children": ["c1", "c2"],
                          }
                      },
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_incremental_data_model_streaming(mock_catalog):
  """Verifies that the parser yields surface updates as items arrive in a dataModelUpdate stream."""
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(f"{A2UI_OPEN_TAG}[")

  # 1. Establish surface
  parser.process_chunk(
      '{"beginRendering": {"root": "item-list", "surfaceId": "default"}}, '
  )

  # 2. Establish surface components with a data binding
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "default", "components": ['
      '{"id": "item-list", "component": {"List": {"children": {"template": {'
      '"componentId": "template-name", "dataBinding": "/items"}}}}}, '
      '{"id": "template-name", "component": {"Text": {"text": {"path": "/name"}}}}'
      "]}}, "
  )
  response_parts = parser.process_chunk(chunk1)
  expected = [{
      "surfaceUpdate": {
          "surfaceId": "default",
          "components": [
              {
                  "id": "item-list",
                  "component": {
                      "List": {
                          "children": {
                              "template": {
                                  "componentId": "template-name",
                                  "dataBinding": "/items",
                              }
                          }
                      }
                  },
              },
              {
                  "id": "template-name",
                  "component": {"Text": {"text": {"path": "/name"}}},
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  # 3. Start streaming dataModelUpdate
  response_parts = parser.process_chunk(
      '{"dataModelUpdate": {"surfaceId": "default", "contents": [{"key": "items",'
      ' "valueMap": ['
  )
  # The parser yields the data model early once it sniffs the start of it
  # AND it triggers a re-yield of reachable components that depend on 'items'
  expected = [
      {
          "dataModelUpdate": {
              "contents": [{"key": "items", "valueMap": []}],
              "surfaceId": "default",
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": "default",
              "components": [
                  {
                      "id": "item-list",
                      "component": {
                          "List": {
                              "children": {
                                  "template": {
                                      "componentId": "template-name",
                                      "dataBinding": "/items",
                                  }
                              }
                          }
                      },
                  },
                  {
                      "id": "template-name",
                      "component": {"Text": {"text": {"path": "/name"}}},
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Add Item 1
  response_parts = parser.process_chunk('{"key": "name", "valueString": "Item 1"}, ')
  expected = [
      {
          "dataModelUpdate": {
              "surfaceId": "default",
              "contents": [{
                  "key": "items",
                  "valueMap": [{"key": "name", "valueString": "Item 1"}],
              }],
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": "default",
              "components": [
                  {
                      "id": "item-list",
                      "component": {
                          "List": {
                              "children": {
                                  "template": {
                                      "componentId": "template-name",
                                      "dataBinding": "/items",
                                  }
                              }
                          }
                      },
                  },
                  {
                      "id": "template-name",
                      "component": {"Text": {"text": {"path": "/name"}}},
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Add Item 2
  response_parts = parser.process_chunk('{"key": "name", "valueString": "Item 2"}]}]}}')
  expected = [
      {
          "dataModelUpdate": {
              "surfaceId": "default",
              "contents": [{
                  "key": "items",
                  "valueMap": [
                      {"key": "name", "valueString": "Item 1"},
                      {"key": "name", "valueString": "Item 2"},
                  ],
              }],
          }
      },
      {
          "surfaceUpdate": {
              "surfaceId": "default",
              "components": [
                  {
                      "id": "item-list",
                      "component": {
                          "List": {
                              "children": {
                                  "template": {
                                      "componentId": "template-name",
                                      "dataBinding": "/items",
                                  }
                              }
                          }
                      },
                  },
                  {
                      "id": "template-name",
                      "component": {"Text": {"text": {"path": "/name"}}},
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)

  # Wrap up the message
  response_parts = parser.process_chunk("]}}}]")
  assert response_parts == []


def test_sniff_partial_invalid_datamodel_fails_gracefully(mock_catalog):
  """Verifies that sniffing a partial DM update that would fail validation doesn't crash."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # 1. Provide a partial chunk where the LAST item in contents is missing a key
  # but the whole thing is loadable after fixing.
  # Note: we use [ to trigger top-level list mode for v0.8
  chunk = (
      '[ {"dataModelUpdate": {"surfaceId": "default", "contents": '
      '[{"key": "name", "valueString": "John"}, {"valueString": "incomplete"'
  )
  # The fix_json will close the array and objects.
  # The second object in contents will be {"valueString": "incomplete"} - missing 'key'.

  response_parts = parser.process_chunk(A2UI_OPEN_TAG + chunk)
  # Should yield only the FIRST valid entry (name: John)
  expected = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [{"key": "name", "valueString": "John"}],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)

  # 2. Provide a chunk that is COMPLETELY invalid (missing key on only entry)
  chunk2 = (
      '{"dataModelUpdate": {"surfaceId": "default", "contents": [{"valueString":'
      ' "no-key"'
  )
  # This yields nothing, but it shouldn't crash
  response_parts = parser.process_chunk(chunk2)
  assert response_parts == []


def test_sniff_partial_datamodel_with_cut_key(mock_catalog):
  """Verifies that an unclosed string like {"key or {"key": "val still yields previous valid entries."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Chunk ending with an open key name
  chunk1 = (
      A2UI_OPEN_TAG
      + '[ {"dataModelUpdate": {"surfaceId": "default", "contents": '
      '[{"key": "infoLink", "valueString": "[More Info](x)"}, {"key'
  )
  response_parts = parser.process_chunk(chunk1)

  expected1 = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [{"key": "infoLink", "valueString": "[More Info](x)"}],
      }
  }]
  assertResponseContainsMessages(response_parts, expected1)

  # Chunk ending inside a string value that IS cuttable (valueString)
  chunk2 = '": "rating", "valueString": "5 star'
  response_parts = parser.process_chunk(chunk2)
  expected2 = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "infoLink", "valueString": "[More Info](x)"},
              {"key": "rating", "valueString": "5 star"},
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected2)

  # Chunk ending inside a string value that IS NOT cuttable due to URL heuristics
  chunk3_url = (
      's"}, {"key": "imageUrl", "valueString": "http://localhost:10002/static/map'
  )
  response_parts = parser.process_chunk(chunk3_url)
  expected3 = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "infoLink", "valueString": "[More Info](x)"},
              {"key": "rating", "valueString": "5 stars"},
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected3)

  # Finish the chunk
  chunk4 = 's.png"}]}}] ' + A2UI_CLOSE_TAG
  response_parts = parser.process_chunk(chunk4)
  expected4 = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "infoLink", "valueString": "[More Info](x)"},
              {"key": "rating", "valueString": "5 stars"},
              {
                  "key": "imageUrl",
                  "valueString": "http://localhost:10002/static/maps.png",
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected4)


def test_sniff_partial_datamodel_cumulative_unmodified_keys(mock_catalog):
  """Verifies that unchanged keys are retained in partial dataModelUpdates."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Chunk 1: 'title' is complete, 'items' is empty
  chunk1 = (
      A2UI_OPEN_TAG
      + '[ {"dataModelUpdate": {"surfaceId": "default", "contents": [{"key": "title",'
      ' "valueString": "Top Restaurants"}, {"key": "items", "valueMap": ['
  )
  response_parts = parser.process_chunk(chunk1)

  expected1 = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "title", "valueString": "Top Restaurants"},
              {"key": "items", "valueMap": []},
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected1)

  # Chunk 2: 'items' starts getting populated, 'title' shouldn't be dropped
  chunk2 = '{"key": "item1", "valueMap": [{"key": "name", "valueString": "Restaurant A"'
  response_parts = parser.process_chunk(chunk2)

  expected2 = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "title", "valueString": "Top Restaurants"},
              {
                  "key": "items",
                  "valueMap": [{
                      "key": "item1",
                      "valueMap": [{"key": "name", "valueString": "Restaurant A"}],
                  }],
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected2)


def test_sniff_partial_datamodel_prunes_empty_keys(mock_catalog):
  """Verifies that entries with only a key and no value are pruned from partial dataModelUpdates."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[ {"dataModelUpdate": {"surfaceId": "default", "contents": ['
      + '{"key": "title", "valueString": "Top Restaurants"},'
      + '{"key": "items", "valueMap": ['
      + '{"key": "item1", "valueMap": [{"key": "name", "valueString": "Food"}, {"key":'
      ' "detail", "valueString": "Spicy"}, {}, {"key": "imageUrl'
  )
  response_parts = parser.process_chunk(chunk)

  expected = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "title", "valueString": "Top Restaurants"},
              {
                  "key": "items",
                  "valueMap": [{
                      "key": "item1",
                      "valueMap": [
                          {"key": "name", "valueString": "Food"},
                          {"key": "detail", "valueString": "Spicy"},
                      ],
                  }],
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_datamodel_prunes_empty_trailing_dict(mock_catalog):
  """Verifies that an incomplete trailing empty dictionary '{}' is dropped."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[ {"dataModelUpdate": {"surfaceId": "default", "contents": ['
      + '{"key": "title", "valueString": "Top Restaurants"},'
      + '{"key": "items", "valueMap": ['
      + '{"key": "item2", "valueMap": [{"key": "name", "valueString": "Han Dynasty"},'
      ' {"key": "imageUrl", "valueString":'
      ' "http://localhost:10002/static/mapotofu.jpeg"}, {}'
      + "]}]} ]}] "
  )
  response_parts = parser.process_chunk(chunk)

  expected = [{
      "dataModelUpdate": {
          "surfaceId": "default",
          "contents": [
              {"key": "title", "valueString": "Top Restaurants"},
              {
                  "key": "items",
                  "valueMap": [{
                      "key": "item2",
                      "valueMap": [
                          {"key": "name", "valueString": "Han Dynasty"},
                          {
                              "key": "imageUrl",
                              "valueString": (
                                  "http://localhost:10002/static/mapotofu.jpeg"
                              ),
                          },
                      ],
                  }],
              },
          ],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_component_discards_empty_children_dict(mock_catalog):
  """Verifies that an incomplete component with an empty children dictionary is discarded until populated."""
  parser = A2uiStreamParser(catalog=mock_catalog)

  chunk = (
      A2UI_OPEN_TAG
      + '[ {"beginRendering": {"surfaceId": "default", "root": "root-column"}},'
      + '{"surfaceUpdate": {"surfaceId": "default", "components": ['
      + '{"id": "root-column", "component": {"Column": {"children": {"explicitList":'
      ' ["item-list"]}}}},'
      + '{"id": "item-list", "component": {"List": {"direction": "vertical",'
      ' "children": {'
  )

  response_parts = parser.process_chunk(chunk)

  # item-list has {"children": {}}. It should be completely discarded from _seen_components.
  # Its parent, root-column, will then replace the missing item-list with a loading placeholder.
  expected = [
      {"beginRendering": {"surfaceId": "default", "root": "root-column"}},
      {
          "surfaceUpdate": {
              "surfaceId": "default",
              "components": [
                  {
                      "component": {
                          "Column": {
                              "children": {"explicitList": ["loading_item-list"]}
                          }
                      },
                      "id": "root-column",
                  },
                  {
                      "component": PLACEHOLDER_COMPONENT,
                      "id": "loading_item-list",
                  },
              ],
          }
      },
  ]

  assertResponseContainsMessages(response_parts, expected)


def test_partial_empty_dict_discarded(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)

  # Establish root
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "root", "surfaceId": "s1"}},'
  )

  # Send a component with an empty dictionary that will be closed by the fixer
  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "root", "component":'
      ' {"Card": {"action": {"context": [{"key": "address", "value": {'
  )
  response_parts = parser.process_chunk(chunk1)
  # Should not yield the component because it contains an empty dictionary `value: {}`.
  # The parser discards it.
  assertResponseContainsNoA2UI(response_parts)

  # Complete the chunk with the expected value
  chunk2 = '"literalString": "123 Main St"}}]}}}}]}}'
  response_parts = parser.process_chunk(chunk2)
  expected = [
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [
                  {
                      "id": "root",
                      "component": {
                          "Card": {
                              "action": {
                                  "context": [{
                                      "key": "address",
                                      "value": {"literalString": "123 Main St"},
                                  }]
                              }
                          }
                      },
                  },
              ],
          }
      },
  ]
  assertResponseContainsMessages(response_parts, expected)


def test_sniff_partial_component_enforces_required_fields(mock_catalog):
  parser = A2uiStreamParser(catalog=mock_catalog)
  parser.process_chunk(
      A2UI_OPEN_TAG + '[{"beginRendering": {"root": "c1", "surfaceId": "s1"}},'
  )

  chunk1 = (
      '{"surfaceUpdate": {"surfaceId": "s1", "components": [{"id": "c1", "component":'
      ' {"AudioPlayer": {"description": "almost ready"'
  )
  response_parts = parser.process_chunk(chunk1)
  assertResponseContainsNoA2UI(response_parts)

  chunk2 = ', "url": {"literalString": "http://audio.mp3"}}}}'
  response_parts = parser.process_chunk(chunk2)

  expected = [{
      "surfaceUpdate": {
          "surfaceId": "s1",
          "components": [{
              "id": "c1",
              "component": {
                  "AudioPlayer": {
                      "description": "almost ready",
                      "url": {"literalString": "http://audio.mp3"},
                  }
              },
          }],
      }
  }]
  assertResponseContainsMessages(response_parts, expected)
