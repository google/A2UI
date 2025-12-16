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
import time
from collections.abc import AsyncIterable
from typing import Any

import instrumentation

import jsonschema
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
from tools import get_restaurants
import ui_schema
import template_renderer
from pydantic import ValidationError
logger = logging.getLogger(__name__)

AGENT_INSTRUCTION = """
    You are a helpful restaurant finding assistant. Your goal is to help users find and book restaurants using a rich UI.

    To achieve this, you MUST follow this logic:

    1.  **For finding restaurants:**
        a. You MUST call the `get_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query (e.g., for "top 5 chinese places", count is 5).
        b. After receiving the data, you MUST follow the instructions precisely to generate the final a2ui UI JSON, using the appropriate UI example from the `prompt_builder.py` based on the number of restaurants.

    2.  **For booking a table (when you receive a query like 'USER_WANTS_TO_BOOK...'):**
        a. You MUST use the appropriate UI example from `prompt_builder.py` to generate the UI, populating the `dataModelUpdate.contents` with the details from the user's query.

    3.  **For confirming a booking (when you receive a query like 'User submitted a booking...'):**
        a. You MUST use the appropriate UI example from `prompt_builder.py` to generate the confirmation UI, populating the `dataModelUpdate.contents` with the final booking details.
"""


class InstrumentedLiteLlm(LiteLlm):
    async def generate_content_async(self, *args, **kwargs):
        logger.info("InstrumentedLiteLlm.generate_content_async called")
        start_time = time.time()
        try:
            async for chunk in super().generate_content_async(*args, **kwargs):
                yield chunk
        finally:
            duration = (time.time() - start_time) * 1000
            instrumentation.track_inference(duration)

    def generate_content(self, *args, **kwargs):
        logger.info("InstrumentedLiteLlm.generate_content (sync) called")
        start_time = time.time()
        try:
            return super().generate_content(*args, **kwargs)
        finally:
            duration = (time.time() - start_time) * 1000
            instrumentation.track_inference(duration)


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
        LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash-lite")

        if use_ui:
            instruction = AGENT_INSTRUCTION + get_ui_prompt()
        else:
            instruction = get_text_prompt()

        return LlmAgent(
            model=InstrumentedLiteLlm(model=LITELLM_MODEL),
            name="restaurant_agent",
            description="An agent that finds restaurants and helps book tables.",
            instruction=instruction,
            tools=[get_restaurants],
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

        # --- Begin: NEW UI Processing Logic ---
        max_retries = 1  # Total 2 attempts
        attempt = 0
        current_query_text = query

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

            async for event in self._runner.run_async(
                user_id=self._user_id,
                session_id=session.id,
                new_message=current_message,
            ):
                if event.is_final_response():
                    if (
                        event.content
                        and event.content.parts
                        and event.content.parts[0].text
                    ):
                        final_response_content = "\n".join(
                            [p.text for p in event.content.parts if p.text]
                        )
                    break
                else:
                    yield {
                        "is_task_complete": False,
                        "updates": self.get_processing_message(),
                    }

            if final_response_content is None:
                logger.warning(
                    f"--- RestaurantAgent.stream: No final response (Attempt {attempt}). ---"
                )
                if attempt <= max_retries:
                    current_query_text = f"No response. Please retry: '{query}'"
                    continue
                else:
                    final_response_content = "I'm sorry, I encountered an error."

            a2ui_messages = None
            error_message = ""
            text_part = final_response_content

            if self.use_ui:
                logger.info(f"--- Validating UI response (Attempt {attempt})... ---")
                try:
                    if "```a2ui" not in final_response_content:
                        raise ValueError("A2UI block not found.")

                    parts = final_response_content.split("```a2ui", 1)
                    text_part = parts[0]
                    json_string = parts[1].split("```", 1)[0]

                    if not json_string.strip():
                        raise ValueError("A2UI JSON part is empty.")

                    parsed_llm_output = json.loads(json_string)
                    llm_output = ui_schema.LLMOutput(**parsed_llm_output)

                    a2ui_messages = template_renderer.render_ui(llm_output, self.base_url)
                    logger.info(f"--- UI content generated successfully (Attempt {attempt}). ---")

                except (ValueError, json.JSONDecodeError, ValidationError) as e:
                    logger.warning(f"--- A2UI output processing failed: {e} (Attempt {attempt}) ---")
                    logger.warning(f"--- Failed content: {final_response_content[:500]}... ---")
                    error_message = f"Output format error: {e}."
                    a2ui_messages = None
            
            if a2ui_messages is not None:
                # Combine text part and A2UI messages for the final response
                a2ui_json_string = json.dumps(a2ui_messages)
                final_output = f"{text_part.strip()}\n---a2ui_JSON---{a2ui_json_string}"
                logger.info(f"--- Sending final response with UI (Attempt {attempt}). ---")
                yield {"is_task_complete": True, "content": final_output}
                return
            elif not self.use_ui:
                 logger.info(f"--- Sending text only response (Attempt {attempt}). ---")
                 yield {"is_task_complete": True, "content": text_part}
                 return

            # --- If we're here, UI generation failed --- 
            if attempt <= max_retries:
                logger.warning(f"--- Retrying... ({attempt}/{max_retries + 1}) ---")
                current_query_text = (
                    f"Your previous response had an issue: {error_message} "
                    "You MUST produce a JSON block between ```a2ui and ``` "
                    f"that conforms to the LLMOutput schema. Retry for original query: '{query}'"
                )
            else:
                logger.error("--- Max retries exhausted. Sending text-only error. ---")
                yield {
                    "is_task_complete": True,
                    "content": text_part + "\n\nI'm having trouble generating the interface right now.",
                }
                return
        # --- End: NEW UI Processing Logic ---
