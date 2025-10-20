import logging
import os

from collections.abc import AsyncIterable
from typing import Any

from google.adk.agents.llm_agent import LlmAgent
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from tools import get_restaurants, get_ui_instructions


logger = logging.getLogger(__name__)

TEXT_ONLY_INSTRUCTION = """
    You are a helpful restaurant finding assistant. Your goal is to help users find and book restaurants using a rich UI.

    To achieve this, you MUST follow this logic:

    1.  **For finding restaurants:**
        a. First, you MUST call the `get_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query (e.g., for "top 5 chinese places", count is 5).
        b. Second, after receiving the data, you MUST call the `get_ui_instructions` tool. You must pass the `base_url` as an argument.
        c. Finally, you will receive a detailed prompt from the `get_ui_instructions` tool. You MUST follow those instructions precisely to generate the final a2ui UI JSON, using the correct template (`SINGLE_COLUMN_LIST_EXAMPLE` or `TWO_COLUMN_LIST_EXAMPLE`) based on the number of restaurants.

    2.  **For booking a table (when you receive a query like 'USER_WANTS_TO_BOOK...'):**
        a. You do not need to call `get_restaurants`.
        b. You MUST immediately call the `get_ui_instructions` tool, passing the `base_url`.
        c. You will receive instructions from the tool. You MUST use the `BOOKING_FORM_EXAMPLE` to generate the UI, populating the `dataModelUpdate.contents` with the details from the user's query.

    3.  **For confirming a booking (when you receive a query like 'User submitted a booking...'):**
        a. You do not need to call any other tools.
        b. You MUST immediately call the `get_ui_instructions` tool, passing the `base_url`.
        c. You will receive instructions from the tool. You MUST use the `CONFIRMATION_EXAMPLE` to generate the confirmation UI, populating the `dataModelUpdate.contents` with the final booking details.
"""


class RestaurantAgent:
    """An agent that finds restaurants based on user criteria."""

    SUPPORTED_CONTENT_TYPES = ['text', 'text/plain']

    def __init__(self, base_url: str):
        self.base_url = base_url
        self._agent = self._build_agent()
        self._user_id = 'remote_agent'
        self.a2ui_ui_instruction = None
        self._runner = Runner(
            app_name=self._agent.name,
            agent=self._agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

    def get_processing_message(self) -> str:
        return 'Finding restaurants that match your criteria...'

    def _build_agent(self) -> LlmAgent:
        """Builds the LLM agent for the restaurant agent."""
        LITELLM_MODEL = os.getenv('LITELLM_MODEL', 'gemini-2.5-flash')

        return LlmAgent(
            model=LiteLlm(model=LITELLM_MODEL),
            name='restaurant_agent',
            description=(
                'This agent finds restaurants based on user criteria like cuisine,'
                ' location, or rating.'
            ),
            instruction=TEXT_ONLY_INSTRUCTION,
            tools=[get_restaurants, get_ui_instructions],
        )

    async def stream(self, query, session_id) -> AsyncIterable[dict[str, Any]]:
        session_state = {'base_url': self.base_url}

        session = await self._runner.session_service.get_session(
            app_name=self._agent.name,
            user_id=self._user_id,
            session_id=session_id,
        )
        content = types.Content(
            role='user', parts=[types.Part.from_text(text=query)]
        )
        if session is None:
            session = await self._runner.session_service.create_session(
                app_name=self._agent.name,
                user_id=self._user_id,
                state=session_state,
                session_id=session_id,
            )
        elif 'base_url' not in session.state:
            session.state['base_url'] = self.base_url

        async for event in self._runner.run_async(
            user_id=self._user_id, session_id=session.id, new_message=content
        ):
            logger.info(f'Event from runner: {event}')
            if event.is_final_response():
                response = ''
                if (
                    event.content
                    and event.content.parts
                    and event.content.parts[0].text
                ):
                    response = '\n'.join(
                        [p.text for p in event.content.parts if p.text]
                    )

                logger.info(f'Final response: {response}')
                yield {
                    'is_task_complete': True,
                    'content': response,
                }
            else:
                logger.info(f'Intermediate event: {event}')
                yield {
                    'is_task_complete': False,
                    'updates': self.get_processing_message(),
                }
