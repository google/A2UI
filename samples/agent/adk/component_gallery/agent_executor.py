# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Agent executor for Component Gallery."""

import logging
import json
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.server.tasks import TaskUpdater
from a2a.types import (DataPart, Part, TaskState, TextPart, AgentCard)
from a2a.utils import new_agent_parts_message, new_task
from agent import ComponentGalleryAgent
from a2ui.a2a.extension import try_activate_a2ui_extension

logger = logging.getLogger(__name__)


class ComponentGalleryExecutor(AgentExecutor):

  def __init__(self, base_url: str, agent_card: AgentCard):
    self.agent = ComponentGalleryAgent(base_url=base_url)
    self._agent_card = agent_card

  async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
    query = "START"  # Default start
    ui_event_part = None

    active_ui_version = try_activate_a2ui_extension(context, self._agent_card)
    logger.info(f"Active UI version: {active_ui_version}")

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

    async for item in self.agent.stream(query, task.context_id, active_ui_version):
      final_parts = item["parts"]

      await updater.update_status(
          TaskState.completed,
          new_agent_parts_message(final_parts, task.context_id, task.id),
          final=True,
      )

  async def cancel(self, request, event_queue):
    pass
