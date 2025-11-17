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

logger = logging.getLogger(__name__)

AGENT_INSTRUCTION = """
    You are a helpful restaurant booking assistant. Your only goal is to help users book restaurants using a rich UI.
    To do this, you MUST use the BOOKING_FORM_EXAMPLE to generate the UI.
"""


class A2UIStreamParser:
    """
    A stateful parser that can incrementally parse A2UI messages from a stream.
    It has a special mode to handle chunking of components within a surfaceUpdate.
    """

    def __init__(self):
        self._buffer = ""
        self._state = "seeking_message"  # seeking_message, in_message, seeking_components, in_component
        self._brace_level = 0
        self._in_string = False
        self._start_pos = -1
        self._surface_id = None
        logger.info("Parser initialized in 'seeking_message' state.")

    def feed(self, chunk: str):
        self._buffer += chunk
        logger.debug(f"Parser feed. Buffer size: {len(self._buffer)}")

    def get_chunks(self):
        chunks = []
        while self._parse_one_chunk(chunks):
            pass
        return chunks

    def _find_matching_brace(self, start_char, end_char, start_pos):
        """Finds the position of the matching closing brace/bracket from a start position."""
        level = 1
        in_string = False
        for i in range(start_pos + 1, len(self._buffer)):
            char = self._buffer[i]
            if char == '"' and (i == 0 or self._buffer[i - 1] != "\\"):
                in_string = not in_string
            elif not in_string:
                if char == start_char:
                    level += 1
                elif char == end_char:
                    level -= 1
                    if level == 0:
                        return i
        return -1

    def _parse_one_chunk(self, chunks):
        if self._state == "seeking_message":
            return self._parse_message_mode(chunks)
        elif self._state == "in_message":
            return self._parse_message_mode(chunks)
        elif self._state == "seeking_components":
            return self._parse_seeking_components_mode()
        elif self._state == "in_component":
            return self._parse_component_mode(chunks)
        return False

    def _parse_message_mode(self, chunks):
        obj_start = self._buffer.find("{")
        if obj_start == -1:
            return False

        # Heuristically check if it's a surfaceUpdate without full parsing
        is_surface_update = '"surfaceUpdate"' in self._buffer[obj_start : obj_start + 20]

        if is_surface_update:
            sid_key_pos = self._buffer.find('"surfaceId"', obj_start)
            if sid_key_pos == -1: return False
            sid_val_start = self._buffer.find('"', sid_key_pos + 11) + 1
            if sid_val_start == 0: return False
            sid_val_end = self._buffer.find('"', sid_val_start)
            if sid_val_end == -1: return False
            self._surface_id = self._buffer[sid_val_start:sid_val_end]

            comp_key_pos = self._buffer.find('"components"', sid_val_end)
            if comp_key_pos == -1: return False
            comp_list_start = self._buffer.find('[', comp_key_pos)
            if comp_list_start == -1: return False

            logger.info(f"Switching to 'in_component' mode for surfaceId: '{self._surface_id}'")
            self._state = "in_component"
            self._buffer = self._buffer[comp_list_start + 1:]
            return True
        else:
            obj_end = self._find_matching_brace("{", "}", obj_start)
            if obj_end == -1: return False

            obj_str = self._buffer[obj_start : obj_end + 1]
            try:
                message = json.loads(obj_str)
                chunks.append(message)
                self._buffer = self._buffer[obj_end + 1:]
                self._state = "seeking_message"
                return True
            except json.JSONDecodeError:
                return False

    def _parse_component_mode(self, chunks):
        self._buffer = self._buffer.lstrip(" \t\n\r,")
        if not self._buffer: return False

        if self._buffer.startswith("]"):
            logger.info("Found end of components array.")
            closing_brace_pos = self._buffer.find("}")
            if closing_brace_pos != -1:
                self._state = "seeking_message"
                logger.debug("State -> seeking_message")
                self._buffer = self._buffer[closing_brace_pos + 1:]
                return True
            else:
                return False

        comp_start = self._buffer.find("{")
        if comp_start != 0: return False

        comp_end = self._find_matching_brace("{", "}", comp_start)
        if comp_end == -1: return False

        comp_str = self._buffer[comp_start : comp_end + 1]
        try:
            component = json.loads(comp_str)
            logger.info(f"Parsed component: {component.get('id')}")
            chunked_message = {
                "surfaceUpdate": {
                    "surfaceId": self._surface_id,
                    "components": [component],
                }
            }
            chunks.append(chunked_message)
            self._buffer = self._buffer[comp_end + 1:]
            return True
        except json.JSONDecodeError:
            return False


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
                    "stream_options": {"include_usage": True},
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
                for a2ui_message in parser.get_chunks():
                    if "surfaceUpdate" in a2ui_message:
                        # The parser now returns chunked components, but we still check for duplicates
                        component = a2ui_message["surfaceUpdate"]["components"][0]
                        comp_id = component.get("id")
                        if comp_id not in sent_component_ids:
                            sent_component_ids.add(comp_id)
                            logger.info(f"Agent yielding chunk: {a2ui_message}")
                            yield {
                                "is_task_complete": False,
                                "content": a2ui_message,
                            }
                    else:
                        # For other messages like beginRendering, yield them directly
                        logger.info(f"Agent yielding message: {a2ui_message}")
                        yield {"is_task_complete": False, "content": a2ui_message}

        # Signal completion once the stream is done
        yield {"is_task_complete": True, "content": None}
