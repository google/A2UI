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

import logging
from typing import Any

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import AgentExtension, Task, Part, DataPart

logger = logging.getLogger(__name__)

# --- Define a2ui UI constants ---
_CORE_PATH = "a2ui.org/ext/a2a-ui/v0.1"
URI = f"https://{_CORE_PATH}"
a2ui_MIME_TYPE = "application/json+a2ui"

def create_a2ui_part(a2ui_data: dict[str, Any]) -> Part:
    return Part(
        root=DataPart(
            data=a2ui_data,
            metadata={
                "mimeType": a2ui_MIME_TYPE,
            },
        )
    )

class a2uiExtension:
    """A generic a2ui UI extension that activates UI mode."""

    def agent_extension(self) -> AgentExtension:
        """Get the AgentExtension representing this extension."""
        return AgentExtension(
            uri=URI,
            description="Provides a declarative a2ui UI JSON structure in messages.",
            params={
                "supportedSchemas": [
                    "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/0.8/json/server_to_client_with_standard_catalog.json"
                ],
                "acceptsDynamicSchemas": True,
            },
        )

    def activate(self, context: RequestContext) -> bool:
        """Checks if the a2ui UI extension was requested by the client."""
        if URI in context.requested_extensions:
            context.add_activated_extension(URI)
            return True
        return False

    def wrap_executor(self, executor: AgentExecutor) -> AgentExecutor:
        """Wrap an executor to activate the extension."""
        return _a2uiExecutor(executor, self)


class _a2uiExecutor(AgentExecutor):
    """Executor wrapper that activates the a2ui UI extension."""

    def __init__(self, delegate: AgentExecutor, ext: a2uiExtension):
        self._delegate = delegate
        self._ext = ext

    async def execute(self, context: RequestContext, event_queue: EventQueue) -> None:
        # The extension's ONLY job is to check for the header and log activation.
        logger.info(
            f"--- Client requested extensions: {context.requested_extensions} ---"
        )
        use_ui = self._ext.activate(context)
        if use_ui:
            logger.info("--- a2ui UI EXTENSION ACTIVATED ---")
        else:
            logger.info("--- a2ui UI EXTENSION *NOT* ACTIVE ---")

        # All parsing logic is now handled correctly inside the delegate executor.
        # We pass the `use_ui` flag to the delegate.
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
