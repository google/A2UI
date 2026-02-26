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
from a2ui.inference.schema.manager import A2uiSchemaManager
from a2ui.extension.send_a2ui_to_client_toolset import convert_send_a2ui_to_client_genai_part_to_a2a_part
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
_A2UI_CATALOG_KEY = "system:a2ui_catalog"
_A2UI_EXAMPLES_KEY = "system:a2ui_examples"


def get_a2ui_catalog(ctx: ReadonlyContext):
  """Retrieves the A2UI catalog from the session state.

  Args:
      ctx: The ReadonlyContext for resolving the catalog.

  Returns:
      The A2UI catalog or None if not found.
  """
  return ctx.state.get(_A2UI_CATALOG_KEY)


def get_a2ui_examples(ctx: ReadonlyContext):
  """Retrieves the A2UI examples from the session state.

  Args:
      ctx: The ReadonlyContext for resolving the examples.

  Returns:
      The A2UI examples or None if not found.
  """
  return ctx.state.get(_A2UI_EXAMPLES_KEY)


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
      schema_manager: A2uiSchemaManager,
  ):
    self._base_url = base_url
    self.schema_manager = schema_manager

    config = A2aAgentExecutorConfig(
        gen_ai_part_converter=convert_send_a2ui_to_client_genai_part_to_a2a_part
    )
    super().__init__(runner=runner, config=config)

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
      capabilities = (
          context.message.metadata.get(A2UI_CLIENT_CAPABILITIES_KEY)
          if context.message and context.message.metadata
          else None
      )
      a2ui_catalog = self.schema_manager.get_effective_catalog(
          client_ui_capabilities=capabilities
      )

      examples = self.schema_manager.load_examples(a2ui_catalog, validate=True)

      await runner.session_service.append_event(
          session,
          Event(
              invocation_id=new_invocation_context_id(),
              author="system",
              actions=EventActions(
                  state_delta={
                      _A2UI_ENABLED_KEY: True,
                      _A2UI_CATALOG_KEY: a2ui_catalog,
                      _A2UI_EXAMPLES_KEY: examples,
                  }
              ),
          ),
      )

    return session
