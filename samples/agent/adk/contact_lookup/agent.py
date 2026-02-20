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
from typing import Any

import jsonschema

# Corrected imports from our new/refactored files
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from a2a.types import AgentCapabilities, AgentCard, AgentSkill

from google.genai import types
from prompt_builder import get_text_prompt, ROLE_DESCRIPTION, WORKFLOW_DESCRIPTION, UI_DESCRIPTION
from tools import get_contact_info
from a2ui.inference.schema.manager import A2uiSchemaManager

logger = logging.getLogger(__name__)


class ContactAgent:
  """An agent that finds contact info for colleagues."""

  SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

  def __init__(self, base_url: str, use_ui: bool = False):
    self.base_url = base_url
    self.use_ui = use_ui
    self._schema_manager = (
        A2uiSchemaManager("0.8", basic_examples_path="examples") if use_ui else None
    )
    self._agent = self._build_agent(use_ui)
    self._user_id = "remote_agent"
    self._runner = Runner(
        app_name=self._agent.name,
        agent=self._agent,
        artifact_service=InMemoryArtifactService(),
        session_service=InMemorySessionService(),
        memory_service=InMemoryMemoryService(),
    )

  def get_agent_card(self) -> AgentCard:
    capabilities = AgentCapabilities(
        streaming=True,
        extensions=[self._schema_manager.get_agent_extension()],
    )
    skill = AgentSkill(
        id="find_contact",
        name="Find Contact Tool",
        description=(
            "Helps find contact information for colleagues (e.g., email, location,"
            " team)."
        ),
        tags=["contact", "directory", "people", "finder"],
        examples=[
            "Who is David Chen in marketing?",
            "Find Sarah Lee from engineering",
        ],
    )

    return AgentCard(
        name="Contact Lookup Agent",
        description=(
            "This agent helps find contact info for people in your organization."
        ),
        url=self.base_url,
        version="1.0.0",
        default_input_modes=ContactAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=ContactAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=capabilities,
        skills=[skill],
    )

  def get_processing_message(self) -> str:
    return "Looking up contact information..."

  def _build_agent(self, use_ui: bool) -> LlmAgent:
    """Builds the LLM agent for the contact agent."""
    LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")

    instruction = (
        self._schema_manager.generate_system_prompt(
            role_description=ROLE_DESCRIPTION,
            workflow_description=WORKFLOW_DESCRIPTION,
            ui_description=UI_DESCRIPTION,
            include_schema=True,
            include_examples=True,
            validate_examples=False,  # Use invalid examples to test retry logic
        )
        if use_ui
        else get_text_prompt()
    )

    return LlmAgent(
        model=LiteLlm(model=LITELLM_MODEL),
        name="contact_agent",
        description="An agent that finds colleague contact info.",
        instruction=instruction,
        tools=[get_contact_info],
    )

  async def stream(self, query, session_id) -> AsyncIterable[dict[str, Any]]:
    session_state = {"base_url": self.base_url}

    session = await self._runner.session_service.get_session(
        app_name=self._agent.name,
        user_id=self._user_id,
        session_id=session_id,
    )
    if session is None:
      session = await self._runner.session_service.create_session(
          app_name=self._agent.name,
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

    # Ensure catalog schema was loaded
    effective_catalog = self._schema_manager.get_effective_catalog()
    if self.use_ui and not effective_catalog.catalog_schema:
      logger.error(
          "--- ContactAgent.stream: A2UI_SCHEMA is not loaded. "
          "Cannot perform UI validation. ---"
      )
      yield {
          "is_task_complete": True,
          "content": (
              "I'm sorry, I'm facing an internal configuration error with my UI"
              " components. Please contact support."
          ),
      }
      return

    while attempt <= max_retries:
      attempt += 1
      logger.info(
          f"--- ContactAgent.stream: Attempt {attempt}/{max_retries + 1} "
          f"for session {session_id} ---"
      )

      current_message = types.Content(
          role="user", parts=[types.Part.from_text(text=current_query_text)]
      )
      final_response_content = None

      async for event in self._runner.run_async(
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
            "--- ContactAgent.stream: Received no final response content from runner "
            f"(Attempt {attempt}). ---"
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

      if self.use_ui:
        logger.info(
            "--- ContactAgent.stream: Validating UI response (Attempt"
            f" {attempt})... ---"
        )
        try:
          if "---a2ui_JSON---" not in final_response_content:
            raise ValueError("Delimiter '---a2ui_JSON---' not found.")

          text_part, json_string = final_response_content.split("---a2ui_JSON---", 1)

          # Handle the "no results found" case
          json_string_cleaned = (
              json_string.strip().lstrip("```json").rstrip("```").strip()
          )
          if not json_string.strip() or json_string_cleaned == "[]":
            logger.info(
                "--- ContactAgent.stream: Empty JSON list found. Assuming valid (e.g.,"
                " 'no results'). ---"
            )
            is_valid = True

          else:
            if not json_string_cleaned:
              raise ValueError("Cleaned JSON string is empty.")

            # --- New Validation Steps ---
            # 1. Check if it's parsable JSON
            parsed_json_data = json.loads(json_string_cleaned)

            # 2. Check if it validates against the A2UI_SCHEMA
            # This will raise jsonschema.exceptions.ValidationError if it fails
            logger.info(
                "--- ContactAgent.stream: Validating against A2UI_SCHEMA... ---"
            )
            effective_catalog.validator.validate(parsed_json_data)
            # --- End New Validation Steps ---

            logger.info(
                "--- ContactAgent.stream: UI JSON successfully parsed AND validated"
                f" against schema. Validation OK (Attempt {attempt}). ---"
            )
            is_valid = True

        except (
            ValueError,
            json.JSONDecodeError,
            jsonschema.exceptions.ValidationError,
        ) as e:
          logger.warning(
              f"--- ContactAgent.stream: A2UI validation failed: {e} (Attempt"
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
            "--- ContactAgent.stream: Response is valid. Sending final response"
            f" (Attempt {attempt}). ---"
        )
        logger.info(f"Final response: {final_response_content}")
        yield {
            "is_task_complete": True,
            "content": final_response_content,
        }
        return  # We're done, exit the generator

      # --- If we're here, it means validation failed ---

      if attempt <= max_retries:
        logger.warning(
            f"--- ContactAgent.stream: Retrying... ({attempt}/{max_retries + 1}) ---"
        )
        # Prepare the query for the retry
        current_query_text = (
            f"Your previous response was invalid. {error_message} You MUST generate a"
            " valid response that strictly follows the A2UI JSON SCHEMA. The response"
            " MUST be a JSON list of A2UI messages. Ensure the response is split by"
            " '---a2ui_JSON---' and the JSON part is well-formed. Please retry the"
            f" original request: '{query}'"
        )
        # Loop continues...

    # --- If we're here, it means we've exhausted retries ---
    logger.error(
        "--- ContactAgent.stream: Max retries exhausted. Sending text-only error. ---"
    )
    yield {
        "is_task_complete": True,
        "content": (
            "I'm sorry, I'm having trouble generating the interface for that request"
            " right now. Please try again in a moment."
        ),
    }
    # --- End: UI Validation and Retry Logic ---
