# Copyright 2025 Google LLC
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


from a2a.server.agent_execution import RequestContext
from a2a.types import DataPart, TextPart, Part
from a2ui.a2a import *
from a2ui.a2a import _select_newest_a2ui_extension
from unittest.mock import MagicMock


def test_a2ui_part_serialization():
  a2ui_data = {"beginRendering": {"surfaceId": "test-surface", "root": "root-column"}}

  part = create_a2ui_part(a2ui_data)

  assert is_a2ui_part(part), "Should be identified as A2UI part"

  data_part = get_a2ui_datapart(part)
  assert data_part is not None, "Should contain DataPart"
  assert a2ui_data == data_part.data, "Deserialized data should match original"


def test_non_a2ui_data_part():
  part = Part(
      root=DataPart(
          data={"foo": "bar"},
          metadata={"mimeType": "application/json"},  # Not A2UI
      )
  )
  assert not is_a2ui_part(part), "Should not be identified as A2UI part"
  assert get_a2ui_datapart(part) is None, "Should not return A2UI DataPart"


def test_non_a2ui_part():
  text_part = TextPart(text="this is some text")
  part = Part(root=text_part)

  assert not is_a2ui_part(part), "Should not be identified as A2UI part"
  assert get_a2ui_datapart(part) is None, "Should not return A2UI DataPart"


def test_get_a2ui_agent_extension():
  version = "0.8"
  agent_extension = get_a2ui_agent_extension(version)
  assert agent_extension.uri == f"{A2UI_EXTENSION_BASE_URI}/v{version}"
  assert agent_extension.params is None


def test_get_a2ui_agent_extension_with_accepts_inline_catalogs():
  version = "0.8"
  accepts_inline_catalogs = True
  agent_extension = get_a2ui_agent_extension(
      version, accepts_inline_catalogs=accepts_inline_catalogs
  )
  assert agent_extension.uri == f"{A2UI_EXTENSION_BASE_URI}/v{version}"
  assert agent_extension.params is not None
  assert (
      agent_extension.params.get(AGENT_EXTENSION_ACCEPTS_INLINE_CATALOGS_KEY)
      == accepts_inline_catalogs
  )


def test_get_a2ui_agent_extension_with_supported_catalog_ids():
  version = "0.8"
  supported_catalog_ids = ["a", "b", "c"]
  agent_extension = get_a2ui_agent_extension(
      version, supported_catalog_ids=supported_catalog_ids
  )
  assert agent_extension.uri == f"{A2UI_EXTENSION_BASE_URI}/v{version}"
  assert agent_extension.params is not None
  assert (
      agent_extension.params.get(AGENT_EXTENSION_SUPPORTED_CATALOG_IDS_KEY)
      == supported_catalog_ids
  )


def test_try_activate_a2ui_extension():
  context = MagicMock(spec=RequestContext)
  uri = f"{A2UI_EXTENSION_BASE_URI}/v0.8"
  context.requested_extensions = [uri]

  card = MagicMock()
  ext = MagicMock()
  ext.uri = uri
  card.capabilities.extensions = [ext]

  assert try_activate_a2ui_extension(context, card) == "0.8"
  context.add_activated_extension.assert_called_once_with(uri)


def test_try_activate_a2ui_extension_not_requested():
  context = MagicMock(spec=RequestContext)
  context.requested_extensions = []

  card = MagicMock()
  ext = MagicMock()
  ext.uri = f"{A2UI_EXTENSION_BASE_URI}/v0.8"
  card.capabilities.extensions = [ext]

  assert try_activate_a2ui_extension(context, card) is None
  context.add_activated_extension.assert_not_called()


def test_select_newest_a2ui_extension():
  requested = [
      f"{A2UI_EXTENSION_BASE_URI}/v0.1.0",
      f"{A2UI_EXTENSION_BASE_URI}/v1.2.0",
      f"{A2UI_EXTENSION_BASE_URI}/v0.8.0",
      f"{A2UI_EXTENSION_BASE_URI}/v1.10.0",
  ]
  advertised = [
      f"{A2UI_EXTENSION_BASE_URI}/v0.1.0",
      f"{A2UI_EXTENSION_BASE_URI}/v1.2.0",
      f"{A2UI_EXTENSION_BASE_URI}/v1.10.0",
      f"{A2UI_EXTENSION_BASE_URI}/v2.0.0",
  ]
  # Should match 0.1.0, 1.2.0 and 1.10.0, and pick 1.10.0 as the newest
  newest = _select_newest_a2ui_extension(requested, advertised)
  assert newest == f"{A2UI_EXTENSION_BASE_URI}/v1.10.0"


def test_select_newest_a2ui_extension_no_match():
  requested = [f"{A2UI_EXTENSION_BASE_URI}/v0.1.0"]
  advertised = [f"{A2UI_EXTENSION_BASE_URI}/v1.2.0"]
  assert _select_newest_a2ui_extension(requested, advertised) is None


def test_try_activate_a2ui_extension_multiple_versions():
  context = MagicMock(spec=RequestContext)
  context.requested_extensions = [
      f"{A2UI_EXTENSION_BASE_URI}/v0.8.0",
      f"{A2UI_EXTENSION_BASE_URI}/v1.0.0",
  ]

  card = MagicMock()
  ext1 = MagicMock()
  ext1.uri = f"{A2UI_EXTENSION_BASE_URI}/v0.8.0"
  ext2 = MagicMock()
  ext2.uri = f"{A2UI_EXTENSION_BASE_URI}/v1.0.0"
  ext3 = MagicMock()
  ext3.uri = f"{A2UI_EXTENSION_BASE_URI}/v1.2.0"
  card.capabilities.extensions = [ext1, ext2, ext3]

  assert try_activate_a2ui_extension(context, card) == "1.0.0"
  context.add_activated_extension.assert_called_once_with(
      f"{A2UI_EXTENSION_BASE_URI}/v1.0.0"
  )
