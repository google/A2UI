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
from pathlib import Path
import pathlib
import pkgutil
from typing import Any, ClassVar, Dict, Optional
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.adk.send_a2ui_to_client_toolset import SendA2uiToClientToolset, A2uiEnabledProvider, A2uiCatalogProvider, A2uiExamplesProvider
from a2ui.schema.manager import A2uiSchemaManager, CatalogConfig
from a2ui.basic_catalog.provider import BasicCatalog
from a2ui.schema.constants import VERSION_0_8, VERSION_0_9
from google.adk.tools.skill_toolset import SkillToolset
from google.adk.skills import load_skill_from_dir
from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.readonly_context import ReadonlyContext
from tools import get_trips_data
from google.adk.planners.built_in_planner import BuiltInPlanner
from google.genai import types
from pydantic import PrivateAttr
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from agent_executor import get_a2ui_enabled, get_a2ui_catalog, get_a2ui_examples
from google.adk.runners import Runner

try:
  from tools import get_store_sales
except ImportError:
  from tools import get_store_sales

logger = logging.getLogger(__name__)


class TravelExpenseAgent:
  """An agent that runs an ecommerce dashboard"""

  SUPPORTED_CONTENT_TYPES: ClassVar[list[str]] = ["text", "text/plain"]

  def __init__(
      self,
      base_url: str,
      model: Any,
  ):
    self.base_url = base_url
    self._model = model

    self._a2ui_enabled_provider = get_a2ui_enabled
    self._a2ui_catalog_provider = get_a2ui_catalog
    self._a2ui_examples_provider = get_a2ui_examples

    self._agent_name = "travel_expense_agent"
    self._user_id = "remote_agent"

    self._session_service = InMemorySessionService()
    self._memory_service = InMemoryMemoryService()
    self._artifact_service = InMemoryArtifactService()

    self._text_runner: Optional[Runner] = self._build_runner(self._build_llm_agent())

    self._schema_managers: Dict[str, A2uiSchemaManager] = {}
    self._ui_runners: Dict[str, Runner] = {}

    for version in [VERSION_0_8, VERSION_0_9]:
      schema_manager = self._build_schema_manager(version)
      self._schema_managers[version] = schema_manager
      agent = self._build_llm_agent(schema_manager)
      self._ui_runners[version] = self._build_runner(agent)
    

    self._agent_card = self._build_agent_card()

  @property
  def agent_card(self) -> AgentCard:
    return self._agent_card

  def get_runner(self, version: Optional[str]) -> Runner:
    if version is None:
      return self._text_runner
    return self._ui_runners[version]

  def get_schema_manager(self, version: Optional[str]) -> Optional[A2uiSchemaManager]:
    if version is None:
      return None
    return self._schema_managers[version]

  def _build_schema_manager(self, version: str) -> A2uiSchemaManager:
    return A2uiSchemaManager(
        version=version,
        catalogs=[
            CatalogConfig.from_path(
                name="travel_expense",
                catalog_path=str(Path(__file__).parent / "catalog_schemas" / "travel_expense_catalog_definition.json"),
            ),
            BasicCatalog.get_config(
                version=version,
            ),
        ],
        accepts_inline_catalogs=True,
    )

    self._a2ui_enabled_provider = a2ui_enabled_provider
    self._a2ui_catalog_provider = a2ui_catalog_provider
    self._a2ui_examples_provider = a2ui_examples_provider

  def _build_agent_card(self) -> AgentCard:
    """Returns the AgentCard defining this agent's metadata and skills.

    Returns:
        An AgentCard object.
    """
    extensions = []
    if self._schema_managers:
      for version, sm in self._schema_managers.items():
        ext = get_a2ui_agent_extension(
            version,
            sm.accepts_inline_catalogs,
            sm.supported_catalog_ids,
        )
        extensions.append(ext)

    capabilities = AgentCapabilities(
        streaming=True,
        extensions=extensions,
    )

    return AgentCard(
        name="Travel Expense Agent",
        description=(
            "This agent answers travel expense inquiries."
        ),
        url=self.base_url,
        version="1.0.0",
        default_input_modes=TravelExpenseAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=TravelExpenseAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=capabilities,
        skills=[
            AgentSkill(
                id="answer_questions",
                name="Answer Travel Expense Questions",
                description="Answers questions about travel expenses and policies.",
                tags=["travel", "expense", "policy"],
                examples=[
                    "What is the meal allowance?",
                    "How do I submit an expense?",
                ],
            ),
        ],
    )

  def _build_runner(self, agent: LlmAgent) -> Runner:
    return Runner(
        app_name=self._agent_name,
        agent=agent,
        artifact_service=self._artifact_service,
        session_service=self._session_service,
        memory_service=self._memory_service,
    )

  def _build_llm_agent(
      self, schema_manager: Optional[A2uiSchemaManager] = None
  ) -> LlmAgent:
    show_travel_and_expense_form_skill = load_skill_from_dir(pathlib.Path(__file__).parent / "skills" / "show-travel-and-expense-form")
    show_travel_and_expense_form_trip_details_skill = load_skill_from_dir(pathlib.Path(__file__).parent / "skills" / "show-travel-and-expense-trip-details")
    show_travel_and_expense_form_trip_report_skill = load_skill_from_dir(pathlib.Path(__file__).parent / "skills" / "show-travel-and-expense-trip-report")
    show_book_vacation_form_skill = load_skill_from_dir(pathlib.Path(__file__).parent / "skills" / "show-book-vacation-form")

    skill_toolset = SkillToolset(
        skills=[show_travel_and_expense_form_skill, show_travel_and_expense_form_trip_details_skill, show_travel_and_expense_form_trip_report_skill, show_book_vacation_form_skill]
    )
    return LlmAgent(
        model=self._model,
        name=self._agent_name,
        description="An agent that can answer travel expenses questions and show a form to submit an expense.",
        instruction="""
        You are a helpful assistant who chats with a user, and your goal is to help answer user questions, especially around travel expenses.

1.  **Analyze the Request:** Determine the user's intent.

2.  **Show UI:**
    * If the user asks to show their trips or expenses, you MUST:
        a. Call the `get_trips_data` tool to get the list of fake trips.
        b. Use the template from the `show-travel-and-expense-form` skill.
        c. Replace the static trip data in the template with the actual data returned by `get_trips_data`.
        d. Return the generated A2UI JSON.
    
    * If the user asks to book a vacation or show the vacation form, you MUST:
        a. Use the template from the `show-book-vacation-form` skill.
        b. Return the generated A2UI JSON.
    
    **CRITICAL**: After sending the UI, you MUST also provide a brief text response in the chat to let the user know what you have displayed (e.g., "Here are your trips." or "Here is the vacation booking form."). Do NOT include the surfaceId or any HTML tags in your text response.

When the user interacts with the UI, you will receive a message including the action name and data.
- If the action is "select_trip", you should show the trip details.
- If the action is "go_back", you should go back and show the expenses form.
- If the action is "select_report", you should show the trip report.
- If the action is "go_back_to_trip_details", you should go back and show the trip details.
- If the action is "submit_vacation", you MUST check if the `comment` field in the context is empty. If it is empty, you MUST reply to the user stating that the comment is required. Do NOT consider the vacation submitted if the comment is empty.
""",
        tools=[
            SendA2uiToClientToolset(
                a2ui_catalog=self._a2ui_catalog_provider,
                a2ui_enabled=self._a2ui_enabled_provider,
                a2ui_examples=self._a2ui_examples_provider,
            ),
            skill_toolset,
            get_trips_data,
        ],
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
            )
        ),
        disallow_transfer_to_peers=True,
    )
