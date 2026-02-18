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
from pathlib import Path
from typing import override

from a2a.server.agent_execution import RequestContext
from a2a.types import AgentCapabilities, AgentCard, AgentExtension, AgentSkill
from a2ui.extension.a2ui_extension import A2UI_CLIENT_CAPABILITIES_KEY
from a2ui.extension.a2ui_extension import A2UI_EXTENSION_URI
from a2ui.extension.a2ui_extension import STANDARD_CATALOG_ID
from a2ui.extension.a2ui_extension import get_a2ui_agent_extension
from a2ui.extension.a2ui_extension import try_activate_a2ui_extension
from a2ui.extension.send_a2ui_to_client_toolset import convert_send_a2ui_to_client_genai_part_to_a2a_part

try:
  from .agent import A2UI_CATALOG_URI_STATE_KEY  # pylint: disable=import-error
  from .agent import RIZZCHARTS_CATALOG_URI  # pylint: disable=import-error
  from .agent import RizzchartsAgent  # pylint: disable=import-error
  from .component_catalog_builder import ComponentCatalogBuilder  # pylint: disable=import-error
except ImportError:
  from agent import A2UI_CATALOG_URI_STATE_KEY
  from agent import RIZZCHARTS_CATALOG_URI
  from agent import RizzchartsAgent
  from component_catalog_builder import ComponentCatalogBuilder
from google.adk.a2a.converters.request_converter import AgentRunRequest
from google.adk.a2a.executor.a2a_agent_executor import A2aAgentExecutor
from google.adk.a2a.executor.a2a_agent_executor import A2aAgentExecutorConfig
from google.adk.agents.invocation_context import new_invocation_context_id
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.events.event import Event
from google.adk.events.event_actions import EventActions
from google.adk.runners import Runner

logger = logging.getLogger(__name__)

_A2UI_ENABLED_KEY = "system:a2ui_enabled"
_A2UI_SCHEMA_KEY = "system:a2ui_schema"


def get_a2ui_schema(ctx: ReadonlyContext):
  """Retrieves the A2UI schema from the session state.

  Args:
      ctx: The ReadonlyContext for resolving the schema.

  Returns:
      The A2UI schema or None if not found.
  """
  return ctx.state.get(_A2UI_SCHEMA_KEY)


def get_a2ui_enabled(ctx: ReadonlyContext):
  """Checks if A2UI is enabled in the current session.

  Args:
      ctx: The ReadonlyContext for resolving enablement.

  Returns:
      True if A2UI is enabled, False otherwise.
  """
  return ctx.state.get(_A2UI_ENABLED_KEY, False)


class RizzchartsAgentExecutor(A2aAgentExecutor):
  """Executor for the Rizzcharts agent that handles A2UI session setup."""

  def __init__(
      self,
      base_url: str,
      runner: Runner,
      a2ui_schema_content: str,
      standard_catalog_content: str,
      rizzcharts_catalog_content: str,
  ):
    self._base_url = base_url
    self._component_catalog_builder = ComponentCatalogBuilder(
        a2ui_schema_content=a2ui_schema_content,
        uri_to_local_catalog_content={
            STANDARD_CATALOG_ID: standard_catalog_content,
            RIZZCHARTS_CATALOG_URI: rizzcharts_catalog_content,
        },
        default_catalog_uri=STANDARD_CATALOG_ID,
    )

    config = A2aAgentExecutorConfig(
        gen_ai_part_converter=convert_send_a2ui_to_client_genai_part_to_a2a_part
    )
    super().__init__(runner=runner, config=config)

  def get_agent_card(self) -> AgentCard:
    """Returns the AgentCard defining this agent's metadata and skills.

    Returns:
        An AgentCard object.
    """
    return AgentCard(
        name="Ecommerce Dashboard Agent",
        description=(
            "This agent visualizes ecommerce data, showing sales breakdowns, YOY"
            " revenue performance, and regional sales outliers."
        ),
        url=self._base_url,
        version="1.0.0",
        default_input_modes=RizzchartsAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=RizzchartsAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=AgentCapabilities(
            streaming=True,
            extensions=[
                get_a2ui_agent_extension(
                    supported_catalog_ids=[STANDARD_CATALOG_ID, RIZZCHARTS_CATALOG_URI]
                )
            ],
        ),
        skills=[
            AgentSkill(
                id="view_sales_by_category",
                name="View Sales by Category",
                description=(
                    "Displays a pie chart of sales broken down by product category for"
                    " a given time period."
                ),
                tags=["sales", "breakdown", "category", "pie chart", "revenue"],
                examples=[
                    "show my sales breakdown by product category for q3",
                    "What's the sales breakdown for last month?",
                ],
            ),
            AgentSkill(
                id="view_regional_outliers",
                name="View Regional Sales Outliers",
                description=(
                    "Displays a map showing regional sales outliers or store-level"
                    " performance."
                ),
                tags=["sales", "regional", "outliers", "stores", "map", "performance"],
                examples=[
                    "interesting. were there any outlier stores",
                    "show me a map of store performance",
                ],
            ),
        ],
    )

  @override
  async def _prepare_session(
      self,
      context: RequestContext,
      run_request: AgentRunRequest,
      runner: Runner,
  ):
    logger.info(f"Loading session for message {context.message}")

    session = await super()._prepare_session(context, run_request, runner)

    if "base_url" not in session.state:
      session.state["base_url"] = self._base_url

    use_ui = try_activate_a2ui_extension(context)
    if use_ui:
      a2ui_schema, catalog_uri = self._component_catalog_builder.load_a2ui_schema(
          client_ui_capabilities=context.message.metadata.get(
              A2UI_CLIENT_CAPABILITIES_KEY
          )
          if context.message and context.message.metadata
          else None
      )

      await runner.session_service.append_event(
          session,
          Event(
              invocation_id=new_invocation_context_id(),
              author="system",
              actions=EventActions(
                  state_delta={
                      _A2UI_ENABLED_KEY: True,
                      _A2UI_SCHEMA_KEY: a2ui_schema,
                      A2UI_CATALOG_URI_STATE_KEY: catalog_uri,
                  }
              ),
          ),
      )

    return session
