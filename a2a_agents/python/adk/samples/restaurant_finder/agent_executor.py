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
)
from a2a.utils import (
    new_agent_parts_message,
    new_agent_text_message,
    new_task,
)
from a2a.utils.errors import ServerError
from a2ui_ext import a2ui_MIME_TYPE
from agent import RestaurantAgent

logger = logging.getLogger(__name__)


class RestaurantAgentExecutor(AgentExecutor):
    """Restaurant AgentExecutor Example."""

    def __init__(self, base_url: str):
        # Instantiate two agents: one for UI and one for text-only.
        # The appropriate one will be chosen at execution time.
        self.ui_agent = RestaurantAgent(base_url=base_url, use_ui=True)
        self.text_agent = RestaurantAgent(base_url=base_url, use_ui=False)

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
        use_ui: bool = False,  # This will be passed by the a2ui wrapper
    ) -> None:
        query = ""
        ui_event_part = None
        action = None

        # Determine which agent to use based on whether the a2ui extension is active.
        if use_ui:
            agent = self.ui_agent
            logger.info(
                "--- AGENT_EXECUTOR: A2UI extension is active. Using UI agent. ---"
            )
        else:
            agent = self.text_agent
            logger.info(
                "--- AGENT_EXECUTOR: A2UI extension is not active. Using text agent. ---"
            )

        if context.message and context.message.parts:
            logger.info(
                f"--- AGENT_EXECUTOR: Processing {len(context.message.parts)} message parts ---"
            )
            for i, part in enumerate(context.message.parts):
                if isinstance(part.root, DataPart):
                    if "userAction" in part.root.data:
                        logger.info(f"  Part {i}: Found a2ui UI ClientEvent payload in DataPart.")
                        ui_event_part = part.root.data["userAction"]
                    else:
                        logger.info(f"  Part {i}: DataPart (data: {part.root.data})")
                elif isinstance(part.root, TextPart):
                    logger.info(f"  Part {i}: TextPart (text: {part.root.text})")
                    try:
                        # Attempt to parse text part as JSON, in case the client sent it that way
                        data = json.loads(part.root.text)
                        if "userAction" in data:
                            logger.info(f"  Part {i}: Found a2ui UI ClientEvent payload in TextPart.")
                            ui_event_part = data["userAction"]
                    except (json.JSONDecodeError, TypeError):
                        # Not a valid JSON or not a string, ignore
                        pass
                else:
                    logger.info(f"  Part {i}: Unknown part type ({type(part.root)})")

        if ui_event_part:
            logger.info(f"Received a2ui ClientEvent: {ui_event_part}")
            action = ui_event_part.get("actionName")
            ctx = ui_event_part.get("context", {})

            if action == "book_restaurant":
                restaurant_name = ctx.get("restaurantName", "Unknown Restaurant")
                address = ctx.get("address", "Address not provided")
                image_url = ctx.get("imageUrl", "")
                query = f"USER_WANTS_TO_BOOK: {restaurant_name}, Address: {address}, ImageURL: {image_url}"

            elif action == "submit_booking":
                restaurant_name = ctx.get("restaurantName", "Unknown Restaurant")
                party_size = ctx.get("partySize", "Unknown Size")
                reservation_time = ctx.get("reservationTime", "Unknown Time")
                dietary_reqs = ctx.get("dietary", "None")
                image_url = ctx.get("imageUrl", "")
                query = f"User submitted a booking for {restaurant_name} for {party_size} people at {reservation_time} with dietary requirements: {dietary_reqs}. The image URL is {image_url}"

            else:
                query = f"User submitted an event: {action} with data: {ctx}"
        else:
            logger.info("No a2ui UI event part found. Falling back to text input.")
            query = context.get_user_input()

        logger.info(f"--- AGENT_EXECUTOR: Final query for LLM: '{query}' ---")

        task = context.current_task

        if not task:
            task = new_task(context.message)
            await event_queue.enqueue_event(task)
        updater = TaskUpdater(event_queue, task.id, task.context_id)

        final_state = TaskState.input_required  # Default final state

        async for item in agent.stream(query, task.context_id):
            if item["is_task_complete"]:
                break

            a2ui_message = item["content"]
            logger.info(f"Executor received message: {a2ui_message}")

            # Determine final state based on actions seen in the stream
            if "surfaceUpdate" in a2ui_message:
                for component in a2ui_message["surfaceUpdate"].get("components", []):
                    action = (
                        component.get("component", {})
                        .get("Button", {})
                        .get("action", {})
                    )
                    if action.get("name") == "submit_booking":
                        final_state = TaskState.completed
                        break

            part = Part(root=DataPart(data=a2ui_message, mime_type=a2ui_MIME_TYPE))
            message = new_agent_parts_message([part], task.context_id, task.id)

            # Send each A2UI message as an intermediate update
            await updater.update_status(TaskState.working, message)

        # Send the final status update once the stream is complete
        await updater.update_status(
            final_state,
            new_agent_text_message("Done.", task.context_id, task.id),
            final=(final_state == TaskState.completed),
        )

    async def cancel(
        self, request: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        raise ServerError(error=UnsupportedOperationError())