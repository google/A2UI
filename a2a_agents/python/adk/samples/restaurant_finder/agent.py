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
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.agents import run_config
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from prompt_builder import (
    A2UI_SCHEMA,
    RESTAURANT_UI_EXAMPLES,
    get_text_prompt,
    get_ui_prompt,
)
from tools import get_restaurants

logger = logging.getLogger(__name__)

AGENT_INSTRUCTION = """
    You are a helpful restaurant booking assistant. Your only goal is to help users book restaurants using a rich UI.
    To do this, you MUST use the BOOKING_FORM_EXAMPLE to generate the UI.
"""


class A2UIStreamParser:
    """
    Parses a stream of text to find and yield complete JSON objects.
    It is designed to find and parse complete `{...}` objects from a
    stream, even if they are wrapped in a list.
    """

    def __init__(self):
        self._buffer = ""

    def feed(self, chunk: str):
        """Appends a chunk of text from the stream to the buffer."""
        self._buffer += chunk
        logger.info(f"Parser feed. Buffer is now: '{self._buffer}'")

    def __iter__(self):
        """Yields complete JSON objects found in the buffer."""
        brace_level = 0
        in_string = False
        obj_start = -1

        i = 0
        while i < len(self._buffer):
            char = self._buffer[i]

            # Basic string detection to ignore braces inside strings
            if char == '"' and (i == 0 or self._buffer[i - 1] != "\\"):
                in_string = not in_string
            elif not in_string:
                if char == "{":
                    if brace_level == 0:
                        obj_start = i
                    brace_level += 1
                elif char == "}":
                    if brace_level > 0:
                        brace_level -= 1
                        if brace_level == 0 and obj_start != -1:
                            # Found a complete JSON object
                            json_str = self._buffer[obj_start : i + 1]
                            try:
                                logger.info(
                                    f"Parser found complete JSON object: {json_str}"
                                )
                                yield json.loads(json_str)
                                # Reset for next object
                                self._buffer = self._buffer[i + 1 :]
                                i = -1  # Restart scan from the beginning of the new buffer
                                obj_start = -1
                            except json.JSONDecodeError:
                                logger.warning(
                                    f"Parser failed to decode JSON: {json_str}"
                                )
                                # It was a false positive, reset start and continue scanning
                                obj_start = -1
            i += 1


class RestaurantAgent:
    """An agent that finds restaurants based on user criteria."""

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

        # --- MODIFICATION: Wrap the schema ---
        # Load the A2UI_SCHEMA string into a Python object for validation
        try:
            # First, load the schema for a *single message*
            single_message_schema = json.loads(A2UI_SCHEMA)

            # The prompt instructs the LLM to return a *list* of messages.
            # Therefore, our validation schema must be an *array* of the single message schema.
            self.a2ui_schema_object = {"type": "array", "items": single_message_schema}
            logger.info(
                "A2UI_SCHEMA successfully loaded and wrapped in an array validator."
            )
        except json.JSONDecodeError as e:
            logger.error(f"CRITICAL: Failed to parse A2UI_SCHEMA: {e}")
            self.a2ui_schema_object = None
        # --- END MODIFICATION ---

    def get_processing_message(self) -> str:
        return "Finding restaurants that match your criteria..."

    def _build_agent(self, use_ui: bool) -> LlmAgent:
        """Builds the LLM agent for the restaurant agent."""
        LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini-2.5-flash")

        if use_ui:
            # Construct the full prompt with UI instructions, examples, and schema
            instruction = AGENT_INSTRUCTION + get_ui_prompt(
                self.base_url, RESTAURANT_UI_EXAMPLES
            )
        else:
            instruction = get_text_prompt()

        return LlmAgent(
            model=LiteLlm(
                model=LITELLM_MODEL,
                model_parameters={
                    "stream": True,
                    "stream_options": {"include_usage": True}
                },
            ),
            name="restaurant_agent",
            description="An agent that helps book restaurant tables.",
            instruction=instruction,
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

        parser = A2UIStreamParser()
        sent_component_ids = set()
        delimiter_found = False

        # The runner must be configured to yield intermediate, partial results
        async for event in self._runner.run_async(
            user_id=self._user_id,
            session_id=session.id,
            run_config = run_config.RunConfig(streaming_mode=run_config.StreamingMode.SSE),
            new_message=types.Content(
                role="user", parts=[types.Part.from_text(text=query)]
            ),
        ):
            if event.content and event.content.parts and event.content.parts[0].text:
                # Feed the raw text from the LLM into our permissive parser
                chunk = event.content.parts[0].text
                logger.info(f"LLM raw chunk: {chunk}")

                # Find and strip the ---a2ui_JSON--- delimiter once
                if not delimiter_found and "---a2ui_JSON---" in chunk:
                    _, json_chunk = chunk.split("---a2ui_JSON---", 1)
                    parser.feed(json_chunk)
                    delimiter_found = True
                elif delimiter_found:
                    parser.feed(chunk)

                # Process any complete JSON objects the parser finds
                for a2ui_message in parser:
                    if "surfaceUpdate" in a2ui_message:
                        # For surface updates, chunk by component
                        update = a2ui_message["surfaceUpdate"]
                        new_components = []
                        for component in update.get("components", []):
                            comp_id = component.get("id")
                            if comp_id not in sent_component_ids:
                                new_components.append(component)
                                sent_component_ids.add(comp_id)

                        if new_components:
                            # Yield a new surfaceUpdate with only the new components
                            chunked_message = {
                                "surfaceUpdate": {
                                    "surfaceId": update["surfaceId"],
                                    "components": new_components,
                                }
                            }
                            logger.info(f"Agent yielding chunk: {chunked_message}")
                            yield {
                                "is_task_complete": False,
                                "content": chunked_message,
                            }
                    else:
                        # For other messages like beginRendering, yield them directly
                        logger.info(f"Agent yielding message: {a2ui_message}")
                        yield {"is_task_complete": False, "content": a2ui_message}

        # Signal completion once the stream is done
        yield {"is_task_complete": True, "content": None}
