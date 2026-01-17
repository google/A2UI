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

"""Landscape Architect Agent - AI-powered photo analysis and form generation."""

import json
import logging
import os
from collections.abc import AsyncIterable
from typing import Any

import jsonschema
from a2ui_examples import LANDSCAPE_UI_EXAMPLES
from a2ui_schema import A2UI_SCHEMA
from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from prompt_builder import get_text_prompt, get_ui_prompt
from tools import (
    analyze_landscape_features,
    generate_design_options,
    create_project_estimate,
)

logger = logging.getLogger(__name__)

AGENT_INSTRUCTION = """
You are an expert Landscape Architect AI assistant. Your goal is to help users transform their outdoor spaces by:
1. Analyzing photos of their current landscape
2. Generating customized questionnaires based on what you see
3. Providing design recommendations and estimates

**CRITICAL: You MUST follow these UI TEMPLATE RULES exactly:**

1. **Welcome/Greeting:**
   - If the user sends a greeting (e.g., "hi", "hello", "start"), generate the UI using the `WELCOME_SCREEN_EXAMPLE` template.

2. **Photo Upload Prompt:**
   - When the user wants to start a project, use the `PHOTO_UPLOAD_EXAMPLE` template to prompt them to upload a photo.

3. **Dynamic Questionnaire Generation:**
   - When you receive a message with `USER_SUBMITTED_PHOTO...`, analyze the photo features provided.
   - You MUST **dynamically generate questionnaire questions** based on what you observe in the photo.
   - Use the `DYNAMIC_QUESTIONNAIRE_EXAMPLE` as your template structure.
   - For example:
     - If you see a lawn: Add a question about lawn renovation options
     - If you see a patio/deck: Add questions about updating or replacing it
     - If you see plants/trees: Add questions about preserving or replacing them
     - If you see fencing: Add questions about fence updates
     - If you see empty space: Add questions about what to add

4. **Design Options:**
   - When you receive `USER_SUBMITTED_QUESTIONNAIRE...`, call the `generate_design_options` tool.
   - Use the `DESIGN_OPTIONS_EXAMPLE` template to present the results.

5. **Project Estimate:**
   - When the user selects a design, call `create_project_estimate` and use the `PROJECT_ESTIMATE_EXAMPLE` template.
"""


class LandscapeArchitectAgent:
    """An agent that analyzes landscape photos and generates custom forms."""

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

        # Load the A2UI_SCHEMA for validation
        try:
            single_message_schema = json.loads(A2UI_SCHEMA)
            self.a2ui_schema_object = {"type": "array", "items": single_message_schema}
            logger.info(
                "A2UI_SCHEMA successfully loaded and wrapped in an array validator."
            )
        except json.JSONDecodeError as e:
            logger.error(f"CRITICAL: Failed to parse A2UI_SCHEMA: {e}")
            self.a2ui_schema_object = None

    def get_processing_message(self) -> str:
        return "Analyzing your landscape and preparing recommendations..."

    def _build_agent(self, use_ui: bool) -> LlmAgent:
        """Builds the LLM agent for the landscape architect."""
        LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")

        if use_ui:
            instruction = AGENT_INSTRUCTION + get_ui_prompt(
                self.base_url, LANDSCAPE_UI_EXAMPLES
            )
        else:
            instruction = get_text_prompt()

        return LlmAgent(
            model=LiteLlm(model=LITELLM_MODEL),
            name="landscape_architect_agent",
            description="An AI landscape architect that analyzes photos and generates custom landscaping forms.",
            instruction=instruction,
            tools=[
                analyze_landscape_features,
                generate_design_options,
                create_project_estimate,
            ],
        )

    async def stream(
        self, query, session_id, image_part=None
    ) -> AsyncIterable[dict[str, Any]]:
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

        max_retries = 3
        attempt = 0
        current_query_text = query

        if self.use_ui and self.a2ui_schema_object is None:
            logger.error("A2UI_SCHEMA is not loaded. Cannot perform UI validation.")
            yield {
                "is_task_complete": True,
                "content": "I'm sorry, I'm facing an internal configuration error. Please contact support.",
            }
            return

        while attempt <= max_retries:
            attempt += 1
            logger.info(
                f"--- LandscapeArchitectAgent.stream: Attempt {attempt}/{max_retries + 1} ---"
            )

            parts = [types.Part.from_text(text=current_query_text)]
            if image_part:
                if image_part.bytes_data:
                    logger.info("Adding image bytes to message")
                    parts.append(
                        types.Part.from_bytes(
                            data=image_part.bytes_data,
                            mime_type=image_part.mime_type or "image/jpeg",
                        )
                    )
                elif image_part.url:
                    logger.info(f"Adding image URL to message: {image_part.url}")
                    parts.append(
                        types.Part.from_uri(
                            file_uri=image_part.url,
                            mime_type=image_part.mime_type or "image/jpeg",
                        )
                    )

            current_message = types.Content(role="user", parts=parts)
            final_response_content = None

            async for event in self._runner.run_async(
                user_id=self._user_id,
                session_id=session.id,
                new_message=current_message,
            ):
                logger.info(f"Event from runner: {event}")
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
                    logger.info(f"Intermediate event: {event}")
                    yield {
                        "is_task_complete": False,
                        "updates": self.get_processing_message(),
                    }

            if final_response_content is None:
                logger.warning(f"No final response content (Attempt {attempt})")
                if attempt <= max_retries:
                    current_query_text = (
                        f"I received no response. Please retry: '{query}'"
                    )
                    continue
                else:
                    final_response_content = (
                        "I'm sorry, I couldn't process your request."
                    )

            is_valid = False
            error_message = ""

            if self.use_ui:
                logger.info(f"Validating UI response (Attempt {attempt})...")
                try:
                    if "---a2ui_JSON---" not in final_response_content:
                        raise ValueError("Delimiter '---a2ui_JSON---' not found.")

                    text_part, json_string = final_response_content.split(
                        "---a2ui_JSON---", 1
                    )

                    if not json_string.strip():
                        raise ValueError("JSON part is empty.")

                    json_string_cleaned = (
                        json_string.strip().lstrip("```json").rstrip("```").strip()
                    )

                    if not json_string_cleaned:
                        raise ValueError("Cleaned JSON string is empty.")

                    parsed_json_data = json.loads(json_string_cleaned)

                    logger.info("Validating against A2UI_SCHEMA...")
                    jsonschema.validate(
                        instance=parsed_json_data, schema=self.a2ui_schema_object
                    )

                    logger.info(f"UI JSON validated successfully (Attempt {attempt}).")
                    is_valid = True

                except (
                    ValueError,
                    json.JSONDecodeError,
                    jsonschema.exceptions.ValidationError,
                ) as e:
                    logger.warning(f"A2UI validation failed: {e} (Attempt {attempt})")
                    logger.warning(
                        f"Failed response: {final_response_content[:500]}..."
                    )
                    error_message = f"Validation failed: {e}."
            else:
                is_valid = True

            if is_valid:
                logger.info(
                    f"Response is valid. Sending final response (Attempt {attempt})."
                )
                yield {
                    "is_task_complete": True,
                    "content": final_response_content,
                }
                return

            if attempt <= max_retries:
                logger.warning(f"Retrying... ({attempt}/{max_retries + 1})")
                current_query_text = (
                    f"Your previous response was invalid. {error_message} "
                    "You MUST generate a valid response following the A2UI JSON SCHEMA. "
                    f"Please retry: '{query}'"
                )

        logger.error("Max retries exhausted. Sending text-only error.")
        yield {
            "is_task_complete": True,
            "content": "I'm sorry, I'm having trouble generating the interface. Please try again.",
        }
