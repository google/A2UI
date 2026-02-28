"""Agent executor for Component Gallery."""

import logging
import json
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import (DataPart, Part, TaskState, TextPart)
from a2a.utils import new_agent_parts_message, new_task
from agent import ComponentGalleryAgent
from a2ui.extension.a2ui_extension import create_a2ui_part, try_activate_a2ui_extension

logger = logging.getLogger(__name__)


class ComponentGalleryExecutor(AgentExecutor):

  def __init__(self, base_url: str):
    self.agent = ComponentGalleryAgent(base_url=base_url)

  async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
    query = "START"  # Default start
    ui_event_part = None

    try_activate_a2ui_extension(context)

    if context.message and context.message.parts:
      for part in context.message.parts:
        if isinstance(part.root, DataPart):
          if "userAction" in part.root.data:
            ui_event_part = part.root.data["userAction"]
          elif "request" in part.root.data:
            query = part.root.data["request"]
        elif isinstance(part.root, TextPart):
          # If user says something, might want to handle it, but for now defaults to START usually for initial connection
          if part.root.text:
            query = part.root.text

    if ui_event_part:
      action = ui_event_part.get("name")
      ctx = ui_event_part.get("context", {})
      query = f"ACTION: {action} with {ctx}"

    task = context.current_task
    if not task:
      task = new_task(context.message)
      await event_queue.enqueue_event(task)

    updater = TaskUpdater(event_queue, task.id, task.context_id)

    async for item in self.agent.stream(query, task.context_id):
      final_parts = []

      if "payload" in item:
        payload = item["payload"]
        text = payload.get("text")
        if text:
          final_parts.append(Part(root=TextPart(text=text)))

        json_data = payload.get("json_data")
        json_string = payload.get("json_string")

        if json_string:
          try:
            json_data = json.loads(json_string)
          except Exception as e:
            logger.error(f"Failed to parse JSON string: {e}")

        if json_data:
          if isinstance(json_data, list):
            for msg in json_data:
              final_parts.append(create_a2ui_part(msg))
          else:
            final_parts.append(create_a2ui_part(json_data))
      else:
        content = item.get("content", "")
        if "---a2ui_JSON---" in content:
          text_content, json_string = content.split("---a2ui_JSON---", 1)
          if text_content.strip():
            final_parts.append(Part(root=TextPart(text=text_content.strip())))

          if json_string.strip():
            try:
              json_data = json.loads(json_string.strip())
              if isinstance(json_data, list):
                for msg in json_data:
                  final_parts.append(create_a2ui_part(msg))
              else:
                final_parts.append(create_a2ui_part(json_data))
            except Exception as e:
              logger.error(f"Failed to parse JSON: {e}")
        elif content:
          final_parts.append(Part(root=TextPart(text=content)))

      await updater.update_status(
          TaskState.completed,
          new_agent_parts_message(final_parts, task.context_id, task.id),
          final=True,
      )

  async def cancel(self, request, event_queue):
    pass
