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

"""Module for the SendA2uiToClientToolset and Part Converter.

This module provides the necessary components to enable an agent to send A2UI (Agent-to-User Interface)
JSON payloads to a client. It includes the `SendA2uiToClientToolset` for managing A2UI tools, a specific tool for the LLM
to send JSON, and a part converter to translate the LLM's tool calls into A2A (Agent-to-Agent) parts.

This is just one approach for capturing A2UI JSON payloads from an LLM.

Key Components:
  * `SendA2uiToClientToolset`: The main entry point. It accepts providers for determining
    if A2UI is enabled and for fetching the A2UI schema. It manages the lifecycle of the
    `_SendA2uiJsonToClientTool`.
  * `_SendA2uiJsonToClientTool`: A tool exposed to the LLM. It allows the LLM to "call" a function
    that effectively sends a JSON payload to the client. This tool validates the JSON against
    the provided schema. It automatically wraps the provided schema in an array structure,
    instructing the LLM that it can send a list of UI items.
  * `convert_send_a2ui_to_client_genai_part_to_a2a_part`: A utility function that intercepts the `send_a2ui_json_to_client`
    tool calls from the LLM and converts them into `a2a_types.Part` objects, which are then
    returned by the A2A Agent Executor.

Usage Examples:

  1. Defining Providers:
    You can use simple values or callables (sync or async) for enablement and schema.

    ```python
    # Simple boolean and dict
    toolset = SendA2uiToClientToolset(a2ui_enabled=True, a2ui_schema=MY_SCHEMA)

    # Async providers
    async def check_enabled(ctx: ReadonlyContext) -> bool:
      return await some_condition(ctx)

    async def get_schema(ctx: ReadonlyContext) -> dict[str, Any]:
      return await fetch_schema(ctx)

    toolset = SendA2uiToClientToolset(a2ui_enabled=check_enabled, a2ui_schema=get_schema)
    ```

  2. Integration with Agent:
    Typically used when initializing an agent's toolset.

    ```python
    # In your agent initialization
    LlmAgent(
        tools=[
            SendA2uiToClientToolset(
                a2ui_enabled=True,
                a2ui_schema=MY_SCHEMA
            )
        ]
    )
    ```

  3. Integration with Executor:
    Configure the executor to use the A2UI part converter.

    ```python
    config = A2aAgentExecutorConfig(
        genai_part_converter=convert_send_a2ui_to_client_genai_part_to_a2a_part
    )
    executor = A2aAgentExecutor(config)
    ```
"""

import inspect
import json
import logging
from typing import Any, Awaitable, Callable, Optional, TypeAlias, Union

import jsonschema

from a2a import types as a2a_types
from a2ui.extension.a2ui_extension import create_a2ui_part
from a2ui.extension.a2ui_schema_utils import wrap_as_json_array
from a2ui.extension.validation import validate_a2ui_json
from google.adk.a2a.converters import part_converter
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.models import LlmRequest
from google.adk.tools import base_toolset
from google.adk.tools.base_tool import BaseTool
from google.adk.tools.tool_context import ToolContext
from google.adk.utils.feature_decorator import experimental
from google.genai import types as genai_types

logger = logging.getLogger(__name__)

A2uiEnabledProvider: TypeAlias = Callable[
    [ReadonlyContext], Union[bool, Awaitable[bool]]
]
A2uiSchemaProvider: TypeAlias = Callable[
    [ReadonlyContext], Union[dict[str, Any], Awaitable[dict[str, Any]]]
]


@experimental
class SendA2uiToClientToolset(base_toolset.BaseToolset):
  """A toolset that provides A2UI Tools and can be enabled/disabled."""

  def __init__(
      self,
      a2ui_enabled: Union[bool, A2uiEnabledProvider],
      a2ui_schema: Union[dict[str, Any], A2uiSchemaProvider],
  ):
    super().__init__()
    self._a2ui_enabled = a2ui_enabled
    self._ui_tools = [self._SendA2uiJsonToClientTool(a2ui_schema)]

  async def _resolve_a2ui_enabled(self, ctx: ReadonlyContext) -> bool:
    """The resolved self.a2ui_enabled field to construct instruction for this agent.

    Args:
        ctx: The ReadonlyContext to resolve the provider with.

    Returns:
        If A2UI is enabled, return True. Otherwise, return False.
    """
    if isinstance(self._a2ui_enabled, bool):
      return self._a2ui_enabled
    else:
      a2ui_enabled = self._a2ui_enabled(ctx)
      if inspect.isawaitable(a2ui_enabled):
        a2ui_enabled = await a2ui_enabled
    return a2ui_enabled

  async def get_tools(
      self,
      readonly_context: Optional[ReadonlyContext] = None,
  ) -> list[BaseTool]:
    """Returns the list of tools provided by this toolset.

    Args:
        readonly_context: The ReadonlyContext for resolving tool enablement.

    Returns:
        A list of tools.
    """
    use_ui = False
    if readonly_context is not None:
      use_ui = await self._resolve_a2ui_enabled(readonly_context)
    if use_ui:
      logger.info("A2UI is ENABLED, adding ui tools")
      return self._ui_tools
    else:
      logger.info("A2UI is DISABLED, not adding ui tools")
      return []

  class _SendA2uiJsonToClientTool(BaseTool):
    TOOL_NAME = "send_a2ui_json_to_client"
    VALIDATED_A2UI_JSON_KEY = "validated_a2ui_json"
    A2UI_JSON_ARG_NAME = "a2ui_json"
    TOOL_ERROR_KEY = "error"

    def __init__(self, a2ui_schema: Union[dict[str, Any], A2uiSchemaProvider]):
      self._a2ui_schema = a2ui_schema
      super().__init__(
          name=self.TOOL_NAME,
          description=(
              "Sends A2UI JSON to the client to render rich UI for the user."
              " This tool can be called multiple times in the same call to"
              " render multiple UI surfaces.Args:   "
              f" {self.A2UI_JSON_ARG_NAME}: Valid A2UI JSON Schema to send to"
              " the client. The A2UI JSON Schema definition is between"
              " ---BEGIN A2UI JSON SCHEMA--- and ---END A2UI JSON SCHEMA--- in"
              " the system instructions."
          ),
      )

    def _get_declaration(self) -> genai_types.FunctionDeclaration | None:
      return genai_types.FunctionDeclaration(
          name=self.name,
          description=self.description,
          parameters=genai_types.Schema(
              type=genai_types.Type.OBJECT,
              properties={
                  self.A2UI_JSON_ARG_NAME: genai_types.Schema(
                      type=genai_types.Type.STRING,
                      description="valid A2UI JSON Schema to send to the client.",
                  ),
              },
              required=[self.A2UI_JSON_ARG_NAME],
          ),
      )

    async def _resolve_a2ui_schema(self, ctx: ReadonlyContext) -> dict[str, Any]:
      """The resolved self.a2ui_schema field to construct instruction for this agent.

      Args:
          ctx: The ReadonlyContext to resolve the provider with.

      Returns:
          The A2UI schema to send to the client.
      """
      if isinstance(self._a2ui_schema, dict):
        return self._a2ui_schema
      else:
        a2ui_schema = self._a2ui_schema(ctx)
        if inspect.isawaitable(a2ui_schema):
          a2ui_schema = await a2ui_schema
        return a2ui_schema

    async def get_a2ui_schema(self, ctx: ReadonlyContext) -> dict[str, Any]:
      """Retrieves and wraps the A2UI schema.

      Args:
          ctx: The ReadonlyContext for resolving the schema.

      Returns:
          The wrapped A2UI schema.
      """
      a2ui_schema = await self._resolve_a2ui_schema(ctx)
      return wrap_as_json_array(a2ui_schema)

    async def process_llm_request(
        self, *, tool_context: ToolContext, llm_request: LlmRequest
    ) -> None:
      await super().process_llm_request(
          tool_context=tool_context, llm_request=llm_request
      )

      a2ui_schema = await self.get_a2ui_schema(tool_context)

      llm_request.append_instructions([f"""
---BEGIN A2UI JSON SCHEMA---
{json.dumps(a2ui_schema)}
---END A2UI JSON SCHEMA---
"""])

      logger.info("Added a2ui_schema to system instructions")

    async def run_async(
        self, *, args: dict[str, Any], tool_context: ToolContext
    ) -> Any:
      try:
        a2ui_json = args.get(self.A2UI_JSON_ARG_NAME)
        if not a2ui_json:
          raise ValueError(
              f"Failed to call tool {self.TOOL_NAME} because missing required"
              f" arg {self.A2UI_JSON_ARG_NAME} "
          )

        a2ui_json_payload = json.loads(a2ui_json)

        # Auto-wrap single object in list
        if not isinstance(a2ui_json_payload, list):
          logger.info(
              "Received a single JSON object, wrapping in a list for validation."
          )
          a2ui_json_payload = [a2ui_json_payload]

        a2ui_schema = await self.get_a2ui_schema(tool_context)
        validate_a2ui_json(a2ui_json_payload, a2ui_schema)

        logger.info(
            f"Validated call to tool {self.TOOL_NAME} with {self.A2UI_JSON_ARG_NAME}"
        )

        # Don't do a second LLM inference call for the JSON response
        tool_context.actions.skip_summarization = True

        # Return the validated JSON so the converter can use it.
        # We return it in a dict under "result" key for consistent JSON structure.
        return {self.VALIDATED_A2UI_JSON_KEY: a2ui_json_payload}

      except Exception as e:
        err = f"Failed to call A2UI tool {self.TOOL_NAME}: {e}"
        logger.error(err)

        return {self.TOOL_ERROR_KEY: err}


@experimental
def convert_send_a2ui_to_client_genai_part_to_a2a_part(
    part: genai_types.Part,
) -> list[a2a_types.Part]:
  if (
      (function_response := part.function_response)
      and function_response.name
      == SendA2uiToClientToolset._SendA2uiJsonToClientTool.TOOL_NAME
  ):
    if (
        SendA2uiToClientToolset._SendA2uiJsonToClientTool.TOOL_ERROR_KEY
        in function_response.response
    ):
      logger.warning(
          "A2UI tool call failed:"
          f" {function_response.response[SendA2uiToClientToolset._SendA2uiJsonToClientTool.TOOL_ERROR_KEY]}"
      )
      return []

    # The tool returns the list of messages directly on success
    json_data = function_response.response.get(
        SendA2uiToClientToolset._SendA2uiJsonToClientTool.VALIDATED_A2UI_JSON_KEY
    )
    if not json_data:
      logger.info("No result in A2UI tool response")
      return []

    final_parts = []
    for message in json_data:
      logger.info(f"Found {len(json_data)} messages. Creating individual DataParts.")
      final_parts.append(create_a2ui_part(message))

    return final_parts

  # Don't send a2ui tool call to client
  elif (
      (function_call := part.function_call)
      and function_call.name
      == SendA2uiToClientToolset._SendA2uiJsonToClientTool.TOOL_NAME
  ):
    return []

  # Use default part converter for other types (images, etc)
  converted_part = part_converter.convert_genai_part_to_a2a_part(part)

  logger.info(f"Returning converted part: {converted_part}")
  return [converted_part] if converted_part else []
