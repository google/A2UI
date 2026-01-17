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

"""Landscape Architect Agent Executor - A2A protocol handler."""

import base64
import json
import logging
import os
import uuid

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import (
    DataPart,
    Part,
    Task,
    TaskState,
    TextPart,
    UnsupportedOperationError,
    FilePart,
)
from a2a.utils import (
    new_agent_parts_message,
    new_agent_text_message,
    new_task,
)
from a2a.utils.errors import ServerError
from a2ui_ext import a2ui_MIME_TYPE
from agent import LandscapeArchitectAgent

logger = logging.getLogger(__name__)


class ImagePart:
    """Represents an image uploaded by the user."""

    def __init__(self, url: str, mime_type: str = None, bytes_data: bytes = None):
        self.url = url
        self.mime_type = mime_type
        self.bytes_data = bytes_data


class LandscapeArchitectExecutor(AgentExecutor):
    """Executor for the Landscape Architect Agent."""

    def __init__(self, base_url: str):
        self.ui_agent = LandscapeArchitectAgent(base_url=base_url, use_ui=True)
        self.text_agent = LandscapeArchitectAgent(base_url=base_url, use_ui=False)

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
        use_ui: bool = False,
    ) -> None:
        query = ""
        ui_event_part = None
        image_part = None
        action = None

        # Determine which agent to use
        if use_ui:
            agent = self.ui_agent
            logger.info("--- EXECUTOR: Using UI agent ---")
        else:
            agent = self.text_agent
            logger.info("--- EXECUTOR: Using text agent ---")

        # Process message parts
        if context.message and context.message.parts:
            logger.info(
                f"--- EXECUTOR: Processing {len(context.message.parts)} message parts ---"
            )
            for i, part in enumerate(context.message.parts):
                if isinstance(part.root, DataPart):
                    if "userAction" in part.root.data:
                        logger.info(f"  Part {i}: Found a2ui UI ClientEvent payload.")
                        ui_event_part = part.root.data["userAction"]
                    else:
                        logger.info(f"  Part {i}: DataPart (data: {part.root.data})")
                elif isinstance(part.root, TextPart):
                    logger.info(f"  Part {i}: TextPart (text: {part.root.text})")
                elif isinstance(part.root, FilePart):
                    logger.info(f"  Part {i}: Found FilePart")
                    file_data = part.root.file
                    if file_data.bytes:
                        logger.info(f"  Extracting {len(part.root.file.bytes)} bytes")
                        try:
                            image_bytes = base64.b64decode(file_data.bytes)
                            mime_type = file_data.mime_type
                            extension = {
                                "image/png": ".png",
                                "image/jpeg": ".jpg",
                                "image/heic": ".heic",
                                "image/webp": ".webp",
                            }.get(mime_type, ".jpg")
                            filename = f"{uuid.uuid4()}{extension}"
                            images_dir = os.path.join(
                                os.path.dirname(__file__), "images", "uploads"
                            )
                            os.makedirs(images_dir, exist_ok=True)
                            filepath = os.path.join(images_dir, filename)
                            with open(filepath, "wb") as f:
                                f.write(image_bytes)

                            image_url = (
                                f"{self.ui_agent.base_url}/images/uploads/{filename}"
                            )
                            mime_type = (
                                file_data.mime_type
                                if file_data.mime_type
                                else "image/jpeg"
                            )
                            image_part = ImagePart(image_url, mime_type, image_bytes)
                            logger.info(
                                f"  Saved image to {filepath}, URL: {image_url}"
                            )
                        except Exception as e:
                            logger.error(f"Failed to save FilePart: {e}")
                    elif file_data.uri:
                        logger.info(f"  Part {i}: FilePart has URI: {file_data.uri}")
                else:
                    logger.info(f"  Part {i}: Unknown part type ({type(part.root)})")

        # Handle UI events
        if ui_event_part:
            logger.info(f"Received a2ui ClientEvent: {ui_event_part}")
            action = ui_event_part.get("name")
            ctx = ui_event_part.get("context", {})

            if action == "start_project":
                logger.info("Handling 'start_project' action.")
                query = "USER_WANTS_TO_START_PROJECT"

            elif action == "upload_photo":
                logger.info("Handling 'upload_photo' action.")
                query = "USER_WANTS_TO_UPLOAD_PHOTO"

            elif action == "submit_photo":
                logger.info("Handling 'submit_photo' action.")
                image_url = ctx.get("imageUrl", "No URL")
                if image_part:
                    image_url = image_part.url
                    logger.info(f"Using image URL from ImagePart: {image_url}")
                query = f"USER_SUBMITTED_PHOTO: Image URL: '{image_url}'. Please analyze this landscape photo and generate a custom questionnaire based on what you observe."

            elif action == "submit_questionnaire":
                logger.info("Handling 'submit_questionnaire' action.")
                # Extract questionnaire responses
                budget = ctx.get("budget", 10000)
                style = ctx.get("style", ["modern"])
                maintenance = ctx.get("maintenance", "medium")
                features = ctx.get("features", [])

                style_str = style[0] if isinstance(style, list) and style else "modern"
                features_str = ", ".join(features) if features else "none specified"

                query = f"USER_SUBMITTED_QUESTIONNAIRE: Budget: ${budget}, Style: {style_str}, Maintenance: {maintenance}, Desired features: {features_str}"

            elif action == "select_design":
                logger.info("Handling 'select_design' action.")
                design_name = ctx.get("designName", "Unknown Design")
                design_price = ctx.get("designPrice", "Unknown Price")
                query = f"USER_SELECTED_DESIGN: {design_name}, Price: {design_price}. Please generate a project estimate."

            elif action == "confirm_project":
                logger.info("Handling 'confirm_project' action.")
                query = "USER_CONFIRMED_PROJECT"

            else:
                logger.warning(f"Handling unknown action: {action}")
                query = f"User submitted an event: {action} with data: {ctx}"
        else:
            logger.info("No a2ui UI event part found. Falling back to text input.")
            user_input = context.get_user_input()
            if image_part:
                query = f"USER_SUBMITTED_PHOTO: Description: '{user_input}', Image: '{image_part.url}'"
            else:
                query = user_input

        logger.info(
            "====================================================================="
        )
        logger.info(f"--- EXECUTOR: Sending query to LLM: '{query}' ---")
        logger.info(
            "====================================================================="
        )

        task = context.current_task

        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)
        updater = TaskUpdater(event_queue, task.id, task.context_id)

        async for item in agent.stream(query, task.context_id, image_part=image_part):
            is_task_complete = item["is_task_complete"]
            if not is_task_complete:
                await updater.update_status(
                    TaskState.working,
                    new_agent_text_message(item["updates"], task.context_id, task.id),
                )
                continue

            final_state = (
                TaskState.completed
                if action == "confirm_project"
                else TaskState.input_required
            )

            content = item["content"]
            final_parts = []
            if "---a2ui_JSON---" in content:
                logger.info("Splitting final response into text and UI parts.")
                text_content, json_string = content.split("---a2ui_JSON---", 1)

                if text_content.strip():
                    final_parts.append(Part(root=TextPart(text=text_content.strip())))

                if json_string.strip():
                    try:
                        json_string_cleaned = (
                            json_string.strip().lstrip("```json").rstrip("```").strip()
                        )
                        json_data = json.loads(json_string_cleaned)

                        if isinstance(json_data, list):
                            logger.info(
                                f"Found {len(json_data)} A2UI messages. Creating DataParts."
                            )
                            for message in json_data:
                                final_parts.append(
                                    Part(
                                        root=DataPart(
                                            data=message,
                                            mime_type=a2ui_MIME_TYPE,
                                        )
                                    )
                                )
                        else:
                            logger.info(
                                "Received single JSON object. Creating DataPart."
                            )
                            final_parts.append(
                                Part(
                                    root=DataPart(
                                        data=json_data,
                                        mime_type=a2ui_MIME_TYPE,
                                    )
                                )
                            )

                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse UI JSON: {e}")
                        final_parts.append(Part(root=TextPart(text=json_string)))
            else:
                final_parts.append(Part(root=TextPart(text=content.strip())))

            logger.info("--- FINAL PARTS TO BE SENT ---")
            for i, part in enumerate(final_parts):
                logger.info(f"  - Part {i}: Type = {type(part.root)}")
                if isinstance(part.root, TextPart):
                    logger.info(f"    - Text: {part.root.text[:200]}...")
                elif isinstance(part.root, DataPart):
                    logger.info(f"    - Data: {str(part.root.data)[:200]}...")
            logger.info("-----------------------------")

            await updater.update_status(
                final_state,
                new_agent_parts_message(final_parts, task.context_id, task.id),
                final=(final_state == TaskState.completed),
            )
            break

    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())
