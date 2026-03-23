# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import logging
from typing import Any, ClassVar

from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a import get_a2ui_agent_extension
from a2ui.adk.a2a_extension.send_a2ui_to_client_toolset import A2uiEnabledProvider, A2uiCatalogProvider, A2uiExamplesProvider, SendA2uiToClientToolset
from a2ui.core.schema.manager import A2uiSchemaManager
from google.adk.agents.llm_agent import LlmAgent
from google.adk.planners.built_in_planner import BuiltInPlanner
from google.genai import types
from pydantic import PrivateAttr

logger = logging.getLogger(__name__)

ROLE_DESCRIPTION = """
You are an expert A2UI Proxy Agent. Your primary function is to fetch the Calculator App and display it to the user.
When the user asks for the calculator, you MUST call the `get_calculator_app` tool.

IMPORTANT: Do NOT attempt to construct the JSON manually. The tool `get_calculator_app` handles it automatically.

When the user interacts with the calculator and issues a `calculate` action, you MUST call the `calculate_via_mcp` tool to perform the calculation via the remote MCP server. Return the resulting number directly as text to the user.
"""

WORKFLOW_DESCRIPTION = """
1. **Analyze Request**: 
   - If User asks for calculator: Call `get_calculator_app`.
   - If User interacts with the calculator (ACTION: calculate): Extract 'operation', 'a', and 'b' from the event context and call `calculate_via_mcp`. Return the result to the user.
"""

UI_DESCRIPTION = """
Use `McpApp` component to render the external app content.
"""


class McpAppProxyAgent(LlmAgent):
  """An agent that proxies MCP Apps."""

  SUPPORTED_CONTENT_TYPES: ClassVar[list[str]] = ["text", "text/plain"]
  base_url: str = ""
  schema_manager: A2uiSchemaManager = None
  _a2ui_enabled_provider: A2uiEnabledProvider = PrivateAttr()
  _a2ui_catalog_provider: A2uiCatalogProvider = PrivateAttr()
  _a2ui_examples_provider: A2uiExamplesProvider = PrivateAttr()

  def __init__(
      self,
      model: Any,
      base_url: str,
      schema_manager: A2uiSchemaManager,
      a2ui_enabled_provider: A2uiEnabledProvider,
      a2ui_catalog_provider: A2uiCatalogProvider,
      a2ui_examples_provider: A2uiExamplesProvider,
      tools: list[Any],  # tools passed in, including get_calculator_app
  ):
    system_instructions = schema_manager.generate_system_prompt(
        role_description=ROLE_DESCRIPTION,
        workflow_description=WORKFLOW_DESCRIPTION,
        ui_description=UI_DESCRIPTION,
        include_schema=False,
        include_examples=False,
        validate_examples=False,
    )

    super().__init__(
        model=model,
        name="mcp_app_proxy_agent",
        description="An agent that provides access to MCP Apps.",
        instruction=system_instructions,
        tools=tools,
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
            )
        ),
        disallow_transfer_to_peers=True,
        base_url=base_url,
        schema_manager=schema_manager,
    )

    self._a2ui_enabled_provider = a2ui_enabled_provider
    self._a2ui_catalog_provider = a2ui_catalog_provider
    self._a2ui_examples_provider = a2ui_examples_provider

  def get_agent_card(self) -> AgentCard:
    return AgentCard(
        name="MCP App Proxy Agent",
        description="Provides access to MCP Apps like Calculator.",
        url=self.base_url,
        version="1.0.0",
        default_input_modes=McpAppProxyAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=McpAppProxyAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=AgentCapabilities(
            streaming=True,
            extensions=[
                get_a2ui_agent_extension(
                    self.schema_manager.accepts_inline_catalogs,
                    self.schema_manager.supported_catalog_ids,
                )
            ],
        ),
        skills=[
            AgentSkill(
                id="open_calculator",
                name="Open Calculator",
                description="Opens the calculator app.",
                tags=["calculator", "app", "tool"],
                examples=["open calculator", "show calculator"],
            )
        ],
    )
