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
from a2ui_examples import load_examples, load_floor_plan_example

# Corrected imports from our new/refactored files
from a2ui_schema import A2UI_SCHEMA
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from prompt_builder import (
    get_text_prompt,
    get_ui_prompt,
)
from tools import get_contact_info

logger = logging.getLogger(__name__)


class ContactAgent:
  """An agent that finds contact info for colleagues."""

  SUPPORTED_CONTENT_TYPES = ["text", "text/plain"]

  def __init__(self, base_url: str, use_ui: bool = False):
    self.base_url = base_url
    self.use_ui = use_ui
    self._agent = self._build_agent(use_ui)
    self._user_id = "remote_agent"
    self._runner = Runner(
        app_name=self._agent.name,
        agent=self._agent,
        artifact_service=InMemoryArtifactService(),
        session_service=InMemorySessionService(),
        memory_service=InMemoryMemoryService(),
    )

    # Load A2UI_SCHEMA and wrap it in an array validator for list responses
    try:
      single_message_schema = json.loads(A2UI_SCHEMA)
      self.a2ui_schema_object = {"type": "array", "items": single_message_schema}
      logger.info("A2UI_SCHEMA successfully loaded and wrapped in an array validator.")
    except json.JSONDecodeError as e:
      logger.error(f"CRITICAL: Failed to parse A2UI_SCHEMA: {e}")
      self.a2ui_schema_object = None
    # --- END MODIFICATION ---

  def get_processing_message(self) -> str:
    return "Looking up contact information..."

  def _build_agent(self, use_ui: bool) -> LlmAgent:
    """Builds the LLM agent for the contact agent."""
    LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")

    if use_ui:
      examples = load_examples(self.base_url)
      instruction = get_ui_prompt(self.base_url, examples)
    else:
      # The text prompt function also returns a complete prompt.
      instruction = get_text_prompt()

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

    # Ensure schema was loaded
    if self.use_ui and self.a2ui_schema_object is None:
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
      logger.info(f"--- ContactAgent.stream: Received query: '{query}' ---")

      # --- Check for User Action ---
      # If the query looks like an action (starts with "ACTION:"), parsing it to see if it's send_message

      if query.startswith("ACTION:") and "send_message" in query:
        logger.info("--- ContactAgent.stream: Detected send_message ACTION ---")

        # Load the action confirmation example dynamically
        try:
          from a2ui_examples import load_examples
          # We might want to expose a specific loader for this, or just read the file here.
          # Since we moved logic to a2ui_examples check if we can import the file constant or just read.
          # Actually, a2ui_examples has EXAMPLE_FILES, let's just re-read using pathlib for simplicity or add a helper.
          # But wait, load_examples returns the formatted string, including delimiters.
          # Let's use the helper we added in a2ui_examples if possible, or just read the file.
          # I didn't add a specific helper for action confirmation in a2ui_examples, but I can read the file.
          pass
        except ImportError:
          pass

        # Re-implement logic to read from file
        from pathlib import Path

        examples_dir = Path(__file__).parent / "examples"
        action_file = examples_dir / "action_confirmation.json"

        if action_file.exists():
          json_content = action_file.read_text(encoding="utf-8").strip()

          # Extract contact name from query if present
          contact_name = "Unknown"
          if "(contact:" in query:
            try:
              contact_name = query.split("(contact:")[1].split(")")[0].strip()
            except Exception:
              pass

          # Inject contact name into the message
          if contact_name != "Unknown":
            json_content = json_content.replace(
                "Your action has been processed.", f"Message sent to {contact_name}!"
            )

        else:
          logger.error(
              "Could not find ACTION_CONFIRMATION_EXAMPLE in CONTACT_UI_EXAMPLES"
          )
          # Fallback to a minimal valid response to avoid crash
          json_content = (
              '[{ "beginRendering": { "surfaceId": "action-modal", "root":'
              ' "modal-wrapper" } }, { "surfaceUpdate": { "surfaceId": "action-modal",'
              ' "components": [ { "id": "modal-wrapper", "component": { "Modal": {'
              ' "entryPointChild": "hidden", "contentChild": "msg", "open": true } } },'
              ' { "id": "hidden", "component": { "Text": { "text": {"literalString": "'
              ' "} } } }, { "id": "msg", "component": { "Text": { "text":'
              ' {"literalString": "Message Sent (Fallback)"} } } } ] } }]'
          )

        final_response_content = (
            f"Message sent to {contact_name}\n---a2ui_JSON---\n{json_content}"
        )

        yield {
            "is_task_complete": True,
            "content": final_response_content,
        }
        return

      if query.startswith("ACTION:") and "view_location" in query:
        logger.info("--- ContactAgent.stream: Detected view_location ACTION ---")

        # Use the predefined example floor plan
        json_content = load_floor_plan_example().strip()
        start_idx = json_content.find("[")
        end_idx = json_content.rfind("]")
        if start_idx != -1 and end_idx != -1:
          json_content = json_content[start_idx : end_idx + 1]

        logger.info(f"--- ContactAgent.stream: Sending Floor Plan ---")
        final_response_content = (
            f"Here is the floor plan.\n---a2ui_JSON---\n{json_content}"
        )
        yield {"is_task_complete": True, "content": final_response_content}
        return

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

            # Validate parsed JSON against A2UI_SCHEMA
            parsed_json_data = json.loads(json_string_cleaned)
            logger.info(
                "--- ContactAgent.stream: Validating against A2UI_SCHEMA... ---"
            )
            jsonschema.validate(
                instance=parsed_json_data, schema=self.a2ui_schema_object
            )
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
