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
import time

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
from agent import ContactAgent
from a2ui.extension.a2ui_extension import create_a2ui_part, try_activate_a2ui_extension

logger = logging.getLogger(__name__)


class ContactAgentExecutor(AgentExecutor):
  """Contact AgentExecutor Example."""

  def __init__(self, base_url: str):
    # Instantiate the UI agent.
    self.ui_agent = ContactAgent(base_url=base_url, use_ui=True)

  async def execute(
      self,
      context: RequestContext,
      event_queue: EventQueue,
  ) -> None:
    query = ""
    ui_event_part = None
    action = None

    logger.info(f"--- Client requested extensions: {context.requested_extensions} ---")
    use_ui = try_activate_a2ui_extension(context)

    # Determine which agent to use based on whether the a2ui extension is active.
    if use_ui:
      agent = self.ui_agent
      logger.info("--- AGENT_EXECUTOR: A2UI extension is active. Using UI agent. ---")
    else:
      # Enforce A2UI extension as per review comment
      error_msg = "A2UI extension is NOT active. This agent requires A2UI to function."
      logger.error(f"--- AGENT_EXECUTOR: {error_msg} ---")
      raise ServerError(error=UnsupportedOperationError(error_msg))

    if context.message and context.message.parts:
      logger.info(
          f"--- AGENT_EXECUTOR: Processing {len(context.message.parts)} message"
          " parts ---"
      )
      for i, part in enumerate(context.message.parts):
        if isinstance(part.root, DataPart):
          if "userAction" in part.root.data:
            logger.info(f"  Part {i}: Found a2ui UI ClientEvent payload.")
            ui_event_part = part.root.data["userAction"]
          elif "request" in part.root.data:
            logger.info(f"  Part {i}: Found 'request' in DataPart.")
            query = part.root.data["request"]

            # Check for inline catalog
            if (
                "metadata" in part.root.data
                and "inlineCatalogs" in part.root.data["metadata"]
            ):
              logger.info(f"  Part {i}: Found 'inlineCatalogs' in DataPart.")
              inline_catalog = part.root.data["metadata"]["inlineCatalogs"]
              catalog_json = json.dumps(inline_catalog)
              # Append to query so the agent sees it (simple injection)
              query += (
                  "\n\n[SYSTEM: The client supports the following custom components:"
                  f" {catalog_json}]"
              )
          else:
            logger.info(f"  Part {i}: DataPart (data: {part.root.data})")
        elif isinstance(part.root, TextPart):
          logger.info(f"  Part {i}: TextPart (text: {part.root.text})")
        else:
          logger.info(f"  Part {i}: Unknown part type ({type(part.root)})")

    if ui_event_part:
      logger.info(f"Received a2ui ClientEvent: {ui_event_part}")
      action = ui_event_part.get("name")
      ctx = ui_event_part.get("context", {})

      if action == "view_profile":
        contact_name = ctx.get("contactName", "Unknown")
        department = ctx.get("department", "")
        query = f"WHO_IS: {contact_name} from {department}"

      elif action == "send_email":
        contact_name = ctx.get("contactName", "Unknown")
        email = ctx.get("email", "Unknown")
        query = f"USER_WANTS_TO_EMAIL: {contact_name} at {email}"

      elif action == "send_message":
        contact_name = ctx.get("contactName", "Unknown")
        query = f"ACTION: send_message (contact: {contact_name})"

      elif action == "view_full_profile":
        contact_name = ctx.get("contactName", "Unknown")
        query = f"USER_WANTS_FULL_PROFILE: {contact_name}"

      elif action == "view_location":
        contact_id = ctx.get("contactId", "Unknown")
        query = f"ACTION: view_location (contactId: {contact_id})"

      elif action == "select_desk":
        contact_id = ctx.get("contactId", "Unknown")
        query = f"ACTION: select_desk contactId:{contact_id}"

      elif action == "chart_node_click":
        node_name = ctx.get("clickedNodeName", "Unknown")
        source = ctx.get("source", "")
        query = f'ACTION: chart_node_click (context: clickedNodeName="{node_name}")'
        if source == "modal":
          query += " (from modal)"

      elif action == "dismiss_modal" or action == "close_modal":
        query = "ACTION: close_modal"

      else:
        query = f"User submitted an event: {action} with data: {ctx}"
    else:
      if not query:
        logger.info("No a2ui UI event part found. Falling back to text input.")
        query = context.get_user_input()

    logger.info(f"--- AGENT_EXECUTOR: Final query for LLM: '{query}' ---")

    task = context.current_task

    if not task:
      task = new_task(context.message)
      await event_queue.enqueue_event(task)
    updater = TaskUpdater(event_queue, task.id, task.context_id)

    async for item in agent.stream(query, task.context_id):
      is_task_complete = item["is_task_complete"]
      if not is_task_complete:
        await updater.update_status(
            TaskState.working,
            new_agent_text_message(item["updates"], task.context_id, task.id),
        )
        continue

      final_state = TaskState.input_required  # Default
      if action in ["send_email", "send_message", "view_full_profile"]:
        final_state = TaskState.completed

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

            # Handle empty JSON list (e.g., no results)
            if not json_string_cleaned or json_string_cleaned == "[]":
              logger.info("Received empty/no JSON part. Skipping DataPart.")
            else:
              json_data = json.loads(json_string_cleaned)
              if isinstance(json_data, list):
                logger.info(
                    f"Found {len(json_data)} messages. Creating individual DataParts."
                )
                for message in json_data:
                  final_parts.append(create_a2ui_part(message))

              else:
                # Handle the case where a single JSON object is returned
                logger.info("Received a single JSON object. Creating a DataPart.")
                final_parts.append(create_a2ui_part(json_data))

          except json.JSONDecodeError as e:
            logger.error(f"Failed to parse UI JSON: {e}")
            final_parts.append(Part(root=TextPart(text=json_string)))
      else:
        final_parts.append(Part(root=TextPart(text=content.strip())))

      # If after all that, we only have empty parts, add a default text response
      if not final_parts or all(
          isinstance(p.root, TextPart) and not p.root.text for p in final_parts
      ):
        final_parts = [Part(root=TextPart(text="OK."))]

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
