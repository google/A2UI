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

import json
import logging
import os
from collections.abc import AsyncIterable
from typing import Any, Optional, Dict

import jsonschema
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
    DataPart,
    Part,
    TextPart,
)
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from prompt_builder import (
    get_text_prompt,
    ROLE_DESCRIPTION,
    UI_DESCRIPTION,
)
from tools import get_restaurants
from a2ui.core.schema.constants import VERSION_0_8, VERSION_0_9, A2UI_OPEN_TAG, A2UI_CLOSE_TAG
from a2ui.core.schema.manager import A2uiSchemaManager
from a2ui.core.parser.parser import parse_response, ResponsePart
from a2ui.basic_catalog.provider import BasicCatalog
from a2ui.core.schema.common_modifiers import remove_strict_validation
from a2ui.a2a import create_a2ui_part, get_a2ui_agent_extension, parse_response_to_parts

logger = logging.getLogger(__name__)


class RestaurantAgent:
  """An agent that finds restaurants based on user criteria."""

  SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

  def __init__(self, base_url: str):
    self.base_url = base_url
    self._agent_name = "Restaurant Agent"
    self._user_id = "remote_agent"
    self._text_runner: Optional[Runner] = self._build_runner(self._build_llm_agent())

    self._schema_managers: Dict[str, A2uiSchemaManager] = {}
    self._ui_runners: Dict[str, Runner] = {}

    for version in [VERSION_0_8, VERSION_0_9]:
      schema_manager = self._build_schema_manager(version)
      self._schema_managers[version] = schema_manager
      agent = self._build_llm_agent(schema_manager)
      self._ui_runners[version] = self._build_runner(agent)

    self._agent_card = self._build_agent_card()

  @property
  def agent_card(self) -> AgentCard:
    return self._agent_card

  def _build_schema_manager(self, version: str) -> A2uiSchemaManager:
    return A2uiSchemaManager(
        version=version,
        catalogs=[
            BasicCatalog.get_config(
                version=version, examples_path=f"examples/{version}"
            )
        ],
        schema_modifiers=[remove_strict_validation],
    )

  def _build_agent_card(self) -> AgentCard:
    extensions = []
    if self._schema_managers:
      for version, sm in self._schema_managers.items():
        ext = get_a2ui_agent_extension(
            version,
            sm.accepts_inline_catalogs,
            sm.supported_catalog_ids,
        )
        extensions.append(ext)

    capabilities = AgentCapabilities(
        streaming=True,
        extensions=extensions,
    )
    skill = AgentSkill(
        id="find_restaurants",
        name="Find Restaurants Tool",
        description=(
            "Helps find restaurants based on user criteria (e.g., cuisine, location)."
        ),
        tags=["restaurant", "finder"],
        examples=["Find me the top 10 chinese restaurants in the US"],
    )

    return AgentCard(
        name="Restaurant Agent",
        description="This agent helps find restaurants based on user criteria.",
        url=self.base_url,
        version="1.0.0",
        default_input_modes=RestaurantAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=RestaurantAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=capabilities,
        skills=[skill],
    )

  def _build_runner(self, agent: LlmAgent) -> Runner:
    return Runner(
        app_name=self._agent_name,
        agent=agent,
        artifact_service=InMemoryArtifactService(),
        session_service=InMemorySessionService(),
        memory_service=InMemoryMemoryService(),
    )

  def get_processing_message(self) -> str:
    return "Finding restaurants that match your criteria..."

  def _build_llm_agent(
      self, schema_manager: Optional[A2uiSchemaManager] = None
  ) -> LlmAgent:
    """Builds the LLM agent for the restaurant agent."""
    LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")

    instruction = (
        schema_manager.generate_system_prompt(
            role_description=ROLE_DESCRIPTION,
            ui_description=UI_DESCRIPTION,
            include_schema=True,
            include_examples=True,
            validate_examples=True,
        )
        if schema_manager
        else get_text_prompt()
    )

    return LlmAgent(
        model=LiteLlm(model=LITELLM_MODEL),
        name="restaurant_agent",
        description="An agent that finds restaurants and helps book tables.",
        instruction=instruction,
        tools=[get_restaurants],
    )

  async def stream(
      self, query, session_id, ui_version: Optional[str] = None
  ) -> AsyncIterable[dict[str, Any]]:
    session_state = {"base_url": self.base_url}

    # Determine which runner to use based on whether the a2ui extension is active.
    if ui_version:
      runner = self._ui_runners[ui_version]
      schema_manager = self._schema_managers[ui_version]
      selected_catalog = (
          schema_manager.get_selected_catalog() if schema_manager else None
      )
    else:
      runner = self._text_runner
      schema_manager = None
      selected_catalog = None

    session = await runner.session_service.get_session(
        app_name=self._agent_name,
        user_id=self._user_id,
        session_id=session_id,
    )
    if session is None:
      session = await runner.session_service.create_session(
          app_name=self._agent_name,
          user_id=self._user_id,
          state=session_state,
          session_id=session_id,
      )
    elif "base_url" not in session.state:
      session.state["base_url"] = self.base_url

    # --- Begin: UI Validation and Retry Logic ---
    max_retries = 1  # Total 2 attempts
    attempt = 0
    current_query_text = query

    # Ensure schema was loaded
    if ui_version and (not selected_catalog or not selected_catalog.catalog_schema):
      logger.error(
          "--- RestaurantAgent.stream: A2UI_SCHEMA is not loaded. "
          "Cannot perform UI validation. ---"
      )
      yield {
          "is_task_complete": True,
          "parts": [
              Part(
                  root=TextPart(
                      text=(
                          "I'm sorry, I'm facing an internal configuration error with"
                          " my UI components. Please contact support."
                      )
                  )
              )
          ],
      }
      return

    while attempt <= max_retries:
      attempt += 1
      logger.info(
          f"--- RestaurantAgent.stream: Attempt {attempt}/{max_retries + 1} "
          f"for session {session_id} ---"
      )

      current_message = types.Content(
          role="user", parts=[types.Part.from_text(text=current_query_text)]
      )
      final_response_content = None

      async for event in runner.run_async(
          user_id=self._user_id,
          session_id=session.id,
          new_message=current_message,
      ):
        logger.info(f"Event from runner: {event}")
        if event.is_final_response():
          if event.content and event.content.parts and event.content.parts[0].text:
            final_response_content = "\n".join(
                [p.text for p in event.content.parts if p.text]
            )
          break  # Got the final response, stop consuming events
        else:
          logger.info(f"Intermediate event: {event}")
          # Yield intermediate updates on every attempt
          yield {
              "is_task_complete": False,
              "updates": self.get_processing_message(),
          }

      if final_response_content is None:
        logger.warning(
            "--- RestaurantAgent.stream: Received no final response content from"
            f" runner (Attempt {attempt}). ---"
        )
        if attempt <= max_retries:
          current_query_text = (
              "I received no response. Please try again."
              f"Please retry the original request: '{query}'"
          )
          continue  # Go to next retry
        else:
          # Retries exhausted on no-response
          final_response_content = (
              "I'm sorry, I encountered an error and couldn't process your request."
          )
          # Fall through to send this as a text-only error

      is_valid = False
      error_message = ""

      if ui_version:
        logger.info(
            "--- RestaurantAgent.stream: Validating UI response (Attempt"
            f" {attempt})... ---"
        )
        try:
          response_parts = parse_response(final_response_content)

          for part in response_parts:
            if not part.a2ui_json:
              continue

            parsed_json_data = part.a2ui_json

            # --- Validation Steps ---
            # Check if it validates against the A2UI_SCHEMA
            # This will raise jsonschema.exceptions.ValidationError if it fails
            logger.info(
                "--- RestaurantAgent.stream: Validating against A2UI_SCHEMA... ---"
            )
            selected_catalog.validator.validate(parsed_json_data)
            # --- End Validation Steps ---

            logger.info(
                "--- RestaurantAgent.stream: UI JSON successfully parsed AND validated"
                f" against schema. Validation OK (Attempt {attempt}). ---"
            )
            is_valid = True

        except (
            ValueError,
            json.JSONDecodeError,
            jsonschema.exceptions.ValidationError,
        ) as e:
          logger.warning(
              f"--- RestaurantAgent.stream: A2UI validation failed: {e} (Attempt"
              f" {attempt}) ---"
          )
          logger.warning(
              f"--- Failed response content: {final_response_content[:500]}... ---"
          )
          error_message = f"Validation failed: {e}."

      else:  # Not using UI, so text is always "valid"
        is_valid = True

      if is_valid:
        logger.info(
            "--- RestaurantAgent.stream: Response is valid. Sending final response"
            f" (Attempt {attempt}). ---"
        )
        final_parts = parse_response_to_parts(
            final_response_content, fallback_text="OK."
        )

        yield {
            "is_task_complete": True,
            "parts": final_parts,
        }
        return  # We're done, exit the generator

      # --- If we're here, it means validation failed ---

      if attempt <= max_retries:
        logger.warning(
            f"--- RestaurantAgent.stream: Retrying... ({attempt}/{max_retries + 1}) ---"
        )
        # Prepare the query for the retry
        current_query_text = (
            f"Your previous response was invalid. {error_message} You MUST generate a"
            " valid response that strictly follows the A2UI JSON SCHEMA. The response"
            " MUST be a JSON list of A2UI messages. Ensure each JSON part is wrapped in"
            f" '{A2UI_OPEN_TAG}' and '{A2UI_CLOSE_TAG}' tags. Please retry the"
            f" original request: '{query}'"
        )
        # Loop continues...

    # --- If we're here, it means we've exhausted retries ---
    logger.error(
        "--- RestaurantAgent.stream: Max retries exhausted. Sending text-only"
        " error. ---"
    )
    yield {
        "is_task_complete": True,
        "parts": [
            Part(
                root=TextPart(
                    text=(
                        "I'm sorry, I'm having trouble generating the interface for"
                        " that request right now. Please try again in a moment."
                    )
                )
            )
        ],
    }
    # --- End: UI Validation and Retry Logic ---
