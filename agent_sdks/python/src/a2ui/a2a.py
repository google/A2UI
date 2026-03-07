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

import logging
from typing import Any, Optional, List

from a2a.server.agent_execution import RequestContext
from a2a.types import AgentExtension, Part, DataPart, TextPart

logger = logging.getLogger(__name__)

A2UI_EXTENSION_URI = "https://a2ui.org/a2a-extension/a2ui/v0.8"
AGENT_EXTENSION_SUPPORTED_CATALOG_IDS_KEY = "supportedCatalogIds"
AGENT_EXTENSION_ACCEPTS_INLINE_CATALOGS_KEY = "acceptsInlineCatalogs"

MIME_TYPE_KEY = "mimeType"
A2UI_MIME_TYPE = "application/json+a2ui"


def create_a2ui_part(a2ui_data: dict[str, Any]) -> Part:
  """Creates an A2A Part containing A2UI data.

  Args:
      a2ui_data: The A2UI data dictionary.

  Returns:
      An A2A Part with a DataPart containing the A2UI data.
  """
  return Part(
      root=DataPart(
          data=a2ui_data,
          metadata={
              MIME_TYPE_KEY: A2UI_MIME_TYPE,
          },
      )
  )


def is_a2ui_part(part: Part) -> bool:
  """Checks if an A2A Part contains A2UI data.

  Args:
      part: The A2A Part to check.

  Returns:
      True if the part contains A2UI data, False otherwise.
  """
  return (
      isinstance(part.root, DataPart)
      and part.root.metadata
      and part.root.metadata.get(MIME_TYPE_KEY) == A2UI_MIME_TYPE
  )


def get_a2ui_datapart(part: Part) -> Optional[DataPart]:
  """Extracts the DataPart containing A2UI data from an A2A Part, if present.

  Args:
      part: The A2A Part to extract A2UI data from.

  Returns:
      The DataPart containing A2UI data if present, None otherwise.
  """
  if is_a2ui_part(part):
    return part.root
  return None


def get_a2ui_agent_extension(
    accepts_inline_catalogs: bool = False,
    supported_catalog_ids: List[str] = [],
) -> AgentExtension:
  """Creates the A2UI AgentExtension configuration.

  Args:
      accepts_inline_catalogs: Whether the agent accepts inline catalogs.
      supported_catalog_ids: All pre-defined catalogs the agent is known to support.

  Returns:
      The configured A2UI AgentExtension.
  """
  params = {}
  if accepts_inline_catalogs:
    params[AGENT_EXTENSION_ACCEPTS_INLINE_CATALOGS_KEY] = (
        True  # Only set if not default of False
    )

  if supported_catalog_ids:
    params[AGENT_EXTENSION_SUPPORTED_CATALOG_IDS_KEY] = supported_catalog_ids

  return AgentExtension(
      uri=A2UI_EXTENSION_URI,
      description="Provides agent driven UI using the A2UI JSON format.",
      params=params if params else None,
  )


def parse_response_to_parts(
    content: str,
    validator: Optional[Any] = None,
    fallback_text: Optional[str] = None,
) -> List[Part]:
  """Helper to parse LLM response content into A2A Parts, with optional validation.

  Args:
      content: The LLM response content, potentially containing A2UI delimiters.
      validator: Optional validator to run against extracted JSON payloads.
      fallback_text: Optional text to return if no parts are successfully created.

  Returns:
      A list of A2A Part objects (TextPart and/or DataPart).
  """
  from a2ui.core.parser.parser import parse_response

  parts = []
  try:
    response_parts = parse_response(content)

    for part in response_parts:
      if part.text:
        parts.append(Part(root=TextPart(text=part.text)))

      if part.a2ui_json:
        json_data = part.a2ui_json
        if validator:
          validator.validate(json_data)

        if isinstance(json_data, list):
          for message in json_data:
            parts.append(create_a2ui_part(message))
        else:
          parts.append(create_a2ui_part(json_data))

  except Exception as e:
    logger.warning(f"Failed to parse or validate A2UI response: {e}")

  if not parts and fallback_text:
    parts.append(Part(root=TextPart(text=fallback_text)))

  return parts


def try_activate_a2ui_extension(context: RequestContext) -> bool:
  """Activates the A2UI extension if requested.

  Args:
      context: The request context to check.

  Returns:
      True if activated, False otherwise.
  """
  if A2UI_EXTENSION_URI in context.requested_extensions or (
      context.message
      and context.message.extensions
      and A2UI_EXTENSION_URI in context.message.extensions
  ):
    context.add_activated_extension(A2UI_EXTENSION_URI)
    return True
  return False
