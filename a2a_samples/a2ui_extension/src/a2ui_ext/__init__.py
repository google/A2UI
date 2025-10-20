import logging

from typing import Any

from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events.event_queue import EventQueue
from a2a.types import AgentExtension, Task


logger = logging.getLogger(__name__)

# --- Define a2ui UI constants ---
_CORE_PATH = 'a2ui.org/ext/a2a-ui/v0.1'
URI = f'https://{_CORE_PATH}'
a2ui_MIME_TYPE = 'application/json+a2ui'


class a2uiExtension:
    """A generic a2ui UI extension that activates UI mode."""

    def agent_extension(self) -> AgentExtension:
        """Get the AgentExtension representing this extension."""
        return AgentExtension(
            uri=URI,
            description='Provides a declarative a2ui UI JSON structure in messages.',
            params={
                'supportedSchemas': [
                    'https://raw.githubusercontent.com/google/a2ui/refs/heads/main/schemas/v0.1/standard_catalog.json'
                ],
                'acceptsDynamicSchemas': True,
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

    async def execute(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        # The extension's ONLY job is to check for the header and log activation.
        if self._ext.activate(context):
            logger.info('--- a2ui UI EXTENSION ACTIVATED ---')
        else:
            logger.info('--- a2ui UI EXTENSION *NOT* ACTIVE ---')

        # All parsing logic is now handled correctly inside the delegate executor.
        await self._delegate.execute(context, event_queue)

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> Task | None:
        return await self._delegate.cancel(context, event_queue)


__all__ = [
    'URI',
    'a2uiExtension',
    'a2ui_MIME_TYPE',
]
