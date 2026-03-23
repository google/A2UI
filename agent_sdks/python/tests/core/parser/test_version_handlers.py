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
from unittest.mock import MagicMock
from a2ui.core.parser.version_handlers import A2uiVersionHandler, A2uiV08Handler, A2uiV09Handler
from a2ui.core.schema.constants import VERSION_0_8, VERSION_0_9
from a2ui.core.parser.constants import (
    MSG_TYPE_BEGIN_RENDERING,
    MSG_TYPE_SURFACE_UPDATE,
    MSG_TYPE_CREATE_SURFACE,
    MSG_TYPE_UPDATE_COMPONENTS,
)


def test_detect_version():
  # v0.9 detection
  assert A2uiVersionHandler.detect_version('{"version": "v0.9"}') == VERSION_0_9
  assert A2uiVersionHandler.detect_version('{"updateComponents": {}}') == VERSION_0_9
  assert A2uiVersionHandler.detect_version('{"createSurface": {}}') == VERSION_0_9

  # v0.8 detection
  assert A2uiVersionHandler.detect_version('{"beginRendering": {}}') == VERSION_0_8
  assert A2uiVersionHandler.detect_version('{"surfaceUpdate": {}}') == VERSION_0_8

  # Unknown
  assert A2uiVersionHandler.detect_version('{"foo": "bar"}') is None


def test_v08_handler_sniff_metadata():
  handler = A2uiV08Handler()
  parser = MagicMock()
  parser.surface_id = None
  parser.root_id = None
  parser.msg_types = []

  json_buffer = '{"surfaceId": "s1", "beginRendering": {"root": "r1"}}'
  handler.sniff_metadata(json_buffer, parser)

  assert parser.surface_id == "s1"
  assert parser.root_id == "r1"
  parser.add_msg_type.assert_called_with(MSG_TYPE_BEGIN_RENDERING)

  json_buffer = json.dumps([
      {"beginRendering": {"surfaceId": "s1", "root": "r1"}},
      {
          "surfaceUpdate": {
              "surfaceId": "s1",
              "components": [{
                  "id": "c1",
                  "component": {"Text": {"text": {"literalString": "hello"}}},
              }],
          }
      },
  ])
  handler.sniff_metadata(json_buffer, parser)
  assert parser.surface_id == "s1"
  assert parser.root_id == "r1"
  parser.add_msg_type.assert_any_call(MSG_TYPE_BEGIN_RENDERING)
  parser.add_msg_type.assert_any_call(MSG_TYPE_SURFACE_UPDATE)


def test_v08_handler_handle_complete_object():
  handler = A2uiV08Handler()
  parser = MagicMock()
  parser.root_id = None
  parser.seen_components = {}
  messages = []

  # beginRendering
  obj = {"beginRendering": {"root": "r1"}}
  assert handler.handle_complete_object(obj, parser, messages) is True
  assert parser.root_id == "r1"
  assert parser.buffered_begin_rendering == obj

  # surfaceUpdate
  obj = {"surfaceUpdate": {"components": [{"id": "c1", "component": {}}]}}
  assert handler.handle_complete_object(obj, parser, messages) is True
  assert "c1" in parser.seen_components
  parser.yield_reachable.assert_called_once()


def test_v09_handler_sniff_metadata():
  handler = A2uiV09Handler()
  parser = MagicMock()
  parser.surface_id = None
  parser.root_id = None
  parser.msg_types = []

  json_buffer = '{"surfaceId": "s1", "updateComponents": {"root": "r2"}}'
  handler.sniff_metadata(json_buffer, parser)

  assert parser.surface_id == "s1"
  assert parser.root_id == "r2"
  parser.add_msg_type.assert_called_with(MSG_TYPE_UPDATE_COMPONENTS)


def test_v09_handler_handle_complete_object():
  handler = A2uiV09Handler()
  parser = MagicMock()
  parser.root_id = None
  parser.seen_components = {}
  messages = []

  # createSurface
  obj = {"createSurface": {"surfaceId": "s1"}}
  assert handler.handle_complete_object(obj, parser, messages) is True
  assert parser.root_id == "root"  # Default for v0.9
  assert parser.buffered_begin_rendering == obj

  # updateComponents
  obj = {
      "updateComponents": {
          "root": "custom",
          "components": [{"id": "custom", "component": {}}],
      }
  }
  assert handler.handle_complete_object(obj, parser, messages) is True
  assert parser.root_id == "custom"
  assert "custom" in parser.seen_components
  parser.yield_reachable.assert_called_once()
