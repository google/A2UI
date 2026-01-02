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

"""A2UI Extension for the Landscape Architect agent."""

import logging
from typing import Any

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import AgentExtension, Task

logger = logging.getLogger(__name__)

# Define A2UI constants
_API_VERSION = "v0.8"
_CORE_PATH = f"a2ui.org/a2a-extension/a2ui/{_API_VERSION}"
URI = f"https://{_CORE_PATH}"
a2ui_MIME_TYPE = "application/json+a2ui"


class a2uiExtension:
    """A generic A2UI extension that activates UI mode."""

    def agent_extension(self) -> AgentExtension:
        """Get the AgentExtension representing this extension."""
        return AgentExtension(
            uri=URI,
            description="Provides a declarative A2UI JSON structure in messages.",
            params={
                "supportedSchemas": [
                    "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/json/server_to_client.json"
                ],
                "acceptsDynamicSchemas": True,
            },
        )

    def activate(self, context: RequestContext) -> bool:
        """Checks if the A2UI extension was requested by the client."""
        if URI in context.requested_extensions:
            context.add_activated_extension(URI)
            return True
        return False

    def wrap_executor(self, executor: AgentExecutor) -> AgentExecutor:
        """Wrap an executor to activate the extension."""
        return _a2uiExecutor(executor, self)


class _a2uiExecutor(AgentExecutor):
    """Executor wrapper that activates the A2UI extension."""

    def __init__(self, delegate: AgentExecutor, ext: a2uiExtension):
        self._delegate = delegate
        self._ext = ext

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        logger.info(
            f"--- Client requested extensions: {context.requested_extensions} ---"
        )
        use_ui = self._ext.activate(context)
        if use_ui:
            logger.info("--- A2UI EXTENSION ACTIVATED ---")
        else:
            logger.info("--- A2UI EXTENSION *NOT* ACTIVE ---")

        await self._delegate.execute(context, event_queue, use_ui=use_ui)

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        return await self._delegate.cancel(context, event_queue)


__all__ = [
    "URI",
    "a2uiExtension",
    "a2ui_MIME_TYPE",
]
