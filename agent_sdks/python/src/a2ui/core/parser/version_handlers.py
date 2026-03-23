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

import re
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TYPE_CHECKING
from ..schema.constants import (
    VERSION_0_9,
    VERSION_0_8,
    SURFACE_ID_KEY,
)
from .response_part import ResponsePart
from .constants import (
    DEFAULT_ROOT_ID,
    MSG_TYPE_BEGIN_RENDERING,
    MSG_TYPE_SURFACE_UPDATE,
    MSG_TYPE_DATA_MODEL_UPDATE,
    MSG_TYPE_DELETE_SURFACE,
    MSG_TYPE_CREATE_SURFACE,
    MSG_TYPE_UPDATE_COMPONENTS,
    MSG_TYPE_UPDATE_DATA_MODEL,
)

if TYPE_CHECKING:
  from .streaming import A2uiStreamParser


class A2uiVersionHandler(ABC):
  """Base class for version-specific A2UI message handling.

  This class decouples A2UI protocol version differences from the core streaming
  parser logic. It encapsulates logic for version-specific message identification,
  metadata extraction, and state transitions.

  Subclasses should be created for each supported A2UI version (e.g., v0.8, v0.9).
  This allows the `A2uiStreamParser` to remain version-agnostic and easily
  extensible for future protocol updates.
  """

  @staticmethod
  def detect_version(json_buffer: str) -> Optional[str]:
    """Detects the A2UI version from the JSON buffer.

    This method is used by the `A2uiStreamParser` at the start of a stream or
    when a new A2UI message block is encountered to determine which version
    handler to use. It performs lightweight pattern matching on the buffered
    JSON text.

    Args:
        json_buffer: The raw JSON string buffered so far.

    Returns:
        The version string (e.g., "0.8", "0.9") if detected, None otherwise.
    """
    # v0.9 markers: "version": "v0.9" or specific message types
    if (
        re.search(rf'"version"\s*:\s*"v{VERSION_0_9}"', json_buffer, re.I)
        or f'"{MSG_TYPE_UPDATE_COMPONENTS}"' in json_buffer
        or f'"{MSG_TYPE_CREATE_SURFACE}"' in json_buffer
    ):
      return VERSION_0_9
    # v0.8 markers
    if (
        f'"{MSG_TYPE_BEGIN_RENDERING}"' in json_buffer
        or f'"{MSG_TYPE_SURFACE_UPDATE}"' in json_buffer
    ):
      return VERSION_0_8
    return None

  @abstractmethod
  def sniff_metadata(self, json_buffer: str, parser: 'A2uiStreamParser'):
    """Sniffs for surfaceId, root, and msg_types in the current json_buffer.

    This method allows for incremental metadata discovery during streaming.
    By looking at the raw JSON buffer fragment, the handler can populate
    the parser's state even before an object is fully closed. This is crucial
    for "fine-grained" streaming where we want to know the context (like
    surfaceId or the root component) as early as possible.

    Should be called as new characters are added to the parser's top-level
    JSON buffer.

    Args:
        json_buffer: The raw JSON string currently being sniffed.
        parser: The A2uiStreamParser instance whose state should be updated.
    """
    pass

  @abstractmethod
  def handle_complete_object(
      self,
      obj: Dict[str, Any],
      parser: 'A2uiStreamParser',
      messages: List[ResponsePart],
  ) -> bool:
    """Handles a completed object from the top-level list.

    This is called when the parser identifies a complete JSON object at the
    top level of the A2UI message array. The handler should check if the
    object is a known message type for its version and update the parser's
    state or yield final/partial messages accordingly.

    Args:
        obj: The fully parsed JSON object (dictionary).
        parser: The A2uiStreamParser instance.
        messages: The list of accumulated A2UI messages to append to.

    Returns:
        True if the object was fully handled by this version handler, False
        if the parser should fall back to shared logic or append it as-is.
    """
    pass

  @abstractmethod
  def is_v08_msg(self, obj: Dict[str, Any]) -> bool:
    """Checks if the object is a recognized v0.8 message."""
    pass

  @abstractmethod
  def get_version(self) -> str:
    """Returns the version string."""
    pass


class A2uiV08Handler(A2uiVersionHandler):
  """Handler for A2UI v0.8 messages."""

  def get_version(self) -> str:
    return VERSION_0_8

  def is_v08_msg(self, obj: Dict[str, Any]) -> bool:
    return any(
        k in obj
        for k in (
            MSG_TYPE_BEGIN_RENDERING,
            MSG_TYPE_SURFACE_UPDATE,
            MSG_TYPE_DATA_MODEL_UPDATE,
            MSG_TYPE_DELETE_SURFACE,
        )
    )

  def sniff_metadata(self, json_buffer: str, parser: 'A2uiStreamParser'):
    if not parser.surface_id:
      match = re.search(r'"surfaceId"\s*:\s*"([^"]+)"', json_buffer)
      if match:
        parser.surface_id = match.group(1)

    if not parser.root_id:
      match = re.search(r'"root"\s*:\s*"([^"]+)"', json_buffer)
      if match:
        parser.root_id = match.group(1)

    if f'"{MSG_TYPE_BEGIN_RENDERING}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_BEGIN_RENDERING)
    if f'"{MSG_TYPE_SURFACE_UPDATE}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_SURFACE_UPDATE)
    if f'"{MSG_TYPE_DATA_MODEL_UPDATE}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_DATA_MODEL_UPDATE)
    if f'"{MSG_TYPE_DELETE_SURFACE}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_DELETE_SURFACE)

  def handle_complete_object(
      self,
      obj: Dict[str, Any],
      parser: 'A2uiStreamParser',
      messages: List[ResponsePart],
  ) -> bool:
    if MSG_TYPE_BEGIN_RENDERING in obj:
      br_val = obj[MSG_TYPE_BEGIN_RENDERING]
      if isinstance(br_val, dict):
        parser.surface_id = br_val.get(SURFACE_ID_KEY, parser.surface_id)
      parser.root_id = br_val.get('root', parser.root_id or DEFAULT_ROOT_ID)
      parser.buffered_begin_rendering = obj
      return True

    if MSG_TYPE_SURFACE_UPDATE in obj:
      parser.add_msg_type(MSG_TYPE_SURFACE_UPDATE)
      components = obj[MSG_TYPE_SURFACE_UPDATE].get('components', [])
      for comp in components:
        if isinstance(comp, dict) and 'id' in comp:
          parser.seen_components[comp['id']] = comp
      parser.yield_reachable(messages, check_root=True, raise_on_orphans=False)
      return True

    if MSG_TYPE_DATA_MODEL_UPDATE in obj:
      parser.add_msg_type(MSG_TYPE_DATA_MODEL_UPDATE)
      parser.update_data_model(obj[MSG_TYPE_DATA_MODEL_UPDATE], messages)
      parser._yield_messages([obj], messages)
      parser.yield_reachable(messages, check_root=False, raise_on_orphans=False)
      return True

    return False


class A2uiV09Handler(A2uiVersionHandler):
  """Handler for A2UI v0.9 messages."""

  def get_version(self) -> str:
    return VERSION_0_9

  def is_v08_msg(self, obj: Dict[str, Any]) -> bool:
    return False

  def sniff_metadata(self, json_buffer: str, parser: 'A2uiStreamParser'):
    if not parser.surface_id:
      match = re.search(r'"surfaceId"\s*:\s*"([^"]+)"', json_buffer)
      if match:
        parser.surface_id = match.group(1)

    if not parser.root_id:
      # v0.9 default root is "root", but it can be overridden
      match = re.search(r'"root"\s*:\s*"([^"]+)"', json_buffer)
      if match:
        parser.root_id = match.group(1)

    if f'"{MSG_TYPE_CREATE_SURFACE}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_CREATE_SURFACE)
    if f'"{MSG_TYPE_UPDATE_COMPONENTS}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_UPDATE_COMPONENTS)
    if f'"{MSG_TYPE_UPDATE_DATA_MODEL}":' in json_buffer:
      parser.add_msg_type(MSG_TYPE_UPDATE_DATA_MODEL)

  def handle_complete_object(
      self,
      obj: Dict[str, Any],
      parser: 'A2uiStreamParser',
      messages: List[ResponsePart],
  ) -> bool:
    if MSG_TYPE_CREATE_SURFACE in obj:
      # createSurface in v0.9 is similar to beginRendering but maybe doesn't establish root yet
      # Actually, v0.9 says root is usually "root".
      parser.root_id = parser.root_id or DEFAULT_ROOT_ID
      parser.buffered_begin_rendering = obj
      return True

    if MSG_TYPE_UPDATE_COMPONENTS in obj:
      parser.add_msg_type(MSG_TYPE_UPDATE_COMPONENTS)
      parser.root_id = obj[MSG_TYPE_UPDATE_COMPONENTS].get(
          'root', parser.root_id or DEFAULT_ROOT_ID
      )
      components = obj[MSG_TYPE_UPDATE_COMPONENTS].get('components', [])
      for comp in components:
        if isinstance(comp, dict) and 'id' in comp:
          parser.seen_components[comp['id']] = comp
      parser.yield_reachable(messages, check_root=True, raise_on_orphans=False)
      return True

    if MSG_TYPE_UPDATE_DATA_MODEL in obj:
      parser.add_msg_type(MSG_TYPE_UPDATE_DATA_MODEL)
      parser.update_data_model(obj[MSG_TYPE_UPDATE_DATA_MODEL], messages)
      parser._yield_messages([obj], messages)
      return True

    return False
