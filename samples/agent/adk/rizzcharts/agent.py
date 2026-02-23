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
import pkgutil
from typing import Any, ClassVar
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.extension.a2ui_extension import STANDARD_CATALOG_ID
from a2ui.extension.send_a2ui_to_client_toolset import SendA2uiToClientToolset, A2uiEnabledProvider, A2uiCatalogProvider, A2uiExamplesProvider
from a2ui.inference.schema.manager import A2uiSchemaManager
from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.planners.built_in_planner import BuiltInPlanner
from google.genai import types
import jsonschema
from pydantic import PrivateAttr

try:
  from .tools import get_sales_data, get_store_sales
except ImportError:
  from tools import get_sales_data, get_store_sales

logger = logging.getLogger(__name__)

RIZZCHARTS_CATALOG_URI = "https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json"

ROLE_DESCRIPTION = """
You are an expert A2UI Ecommerce Dashboard analyst. Your primary function is to translate user requests for ecommerce data into A2UI JSON payloads to display charts and visualizations. You MUST use the `send_a2ui_json_to_client` tool with the `a2ui_json` argument set to the A2UI JSON payload to send to the client. You should also include a brief text message with each response saying what you did and asking if you can help with anything else.
"""

WORKFLOW_DESCRIPTION = """
Your task is to analyze the user's request, fetch the necessary data, select the correct generic template, and send the corresponding A2UI JSON payload.

1.  **Analyze the Request:** Determine the user's intent (Visual Chart vs. Geospatial Map).
    * "show my sales breakdown by product category for q3" -> **Intent:** Chart.
    * "show revenue trends yoy by month" -> **Intent:** Chart.
    * "were there any outlier stores in the northeast region" -> **Intent:** Map.

2.  **Fetch Data:** Select and use the appropriate tool to retrieve the necessary data.
    * Use **`get_sales_data`** for general sales, revenue, and product category trends (typically for Charts).
    * Use **`get_store_sales`** for regional performance, store locations, and geospatial outliers (typically for Maps).

3.  **Select Example:** Based on the intent, choose the correct example block to use as your template.
    * **Intent** (Chart/Data Viz) -> Use `---BEGIN CHART EXAMPLE---`.
    * **Intent** (Map/Geospatial) -> Use `---BEGIN MAP EXAMPLE---`.

4.  **Construct the JSON Payload:**
    * Use the **entire** JSON array from the chosen example as the base value for the `a2ui_json` argument.
    * **Generate a new `surfaceId`:** You MUST generate a new, unique `surfaceId` for this request (e.g., `sales_breakdown_q3_surface`, `regional_outliers_northeast_surface`). This new ID must be used for the `surfaceId` in all three messages within the JSON array (`beginRendering`, `surfaceUpdate`, `dataModelUpdate`).
    * **Update the title Text:** You MUST update the `literalString` value for the `Text` component (the component with `id: "page_header"`) to accurately reflect the specific user query. For example, if the user asks for "Q3" sales, update the generic template text to "Q3 2025 Sales by Product Category".
    * Ensure the generated JSON perfectly matches the A2UI specification. It will be validated against the json_schema and rejected if it does not conform.  
    * If you get an error in the tool response apologize to the user and let them know they should try again.

5.  **Call the Tool:** Call the `send_a2ui_json_to_client` tool with the fully constructed `a2ui_json` payload.
"""

UI_DESCRIPTION = """
**Core Objective:** To provide a dynamic and interactive dashboard by constructing UI surfaces with the appropriate visualization components based on user queries.

**Key Components & Examples:**

You will be provided a schema that defines the A2UI message structure and two key generic component templates for displaying data.

1.  **Charts:** Used for requests about sales breakdowns, revenue performance, comparisons, or trends.
    * **Template:** Use the JSON from `---BEGIN CHART EXAMPLE---`.
2.  **Maps:** Used for requests about regional data, store locations, geography-based performance, or regional outliers.
    * **Template:** Use the JSON from `---BEGIN MAP EXAMPLE---`.

You will also use layout components like `Column` (as the `root`) and `Text` (to provide a title).
"""


class RizzchartsAgent(LlmAgent):
  """An agent that runs an ecommerce dashboard"""

  SUPPORTED_CONTENT_TYPES: ClassVar[list[str]] = ["text", "text/plain"]
  base_url: str = ""
  schema_manager: A2uiSchemaManager = None
  _a2ui_enabled_provider: A2uiEnabledProvider = PrivateAttr()
  _a2ui_catalog_provider: A2uiCatalogProvider = PrivateAttr()
  _a2ui_examples_provider: A2uiExamplesProvider = PrivateAttr()

  def __init__(
      self,
      model: Any,
      base_url: str,
      schema_manager: A2uiSchemaManager,
      a2ui_enabled_provider: A2uiEnabledProvider,
      a2ui_catalog_provider: A2uiCatalogProvider,
      a2ui_examples_provider: A2uiExamplesProvider,
  ):
    """Initializes the RizzchartsAgent.

    Args:
        model: The LLM model to use.
        base_url: The base URL for the agent.
        schema_manager: The A2UI schema manager.
        a2ui_enabled_provider: A provider to check if A2UI is enabled.
        a2ui_catalog_provider: A provider to retrieve the A2UI catalog (A2uiCatalog object).
        a2ui_examples_provider: A provider to retrieve the A2UI examples (str).
    """

    system_instructions = schema_manager.generate_system_prompt(
        role_description=ROLE_DESCRIPTION,
        workflow_description=WORKFLOW_DESCRIPTION,
        ui_description=UI_DESCRIPTION,
        include_schema=False,
        include_examples=False,
        validate_examples=False,
    )
    super().__init__(
        model=model,
        name="rizzcharts_agent",
        description="An agent that lets sales managers request sales data.",
        instruction=system_instructions,
        tools=[
            get_store_sales,
            get_sales_data,
            SendA2uiToClientToolset(
                a2ui_catalog=a2ui_catalog_provider,
                a2ui_enabled=a2ui_enabled_provider,
                a2ui_examples=a2ui_examples_provider,
            ),
        ],
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
            )
        ),
        disallow_transfer_to_peers=True,
        base_url=base_url,
        schema_manager=schema_manager,
    )

    self._a2ui_enabled_provider = a2ui_enabled_provider
    self._a2ui_catalog_provider = a2ui_catalog_provider
    self._a2ui_examples_provider = a2ui_examples_provider

  def get_agent_card(self) -> AgentCard:
    """Returns the AgentCard defining this agent's metadata and skills.

    Returns:
        An AgentCard object.
    """
    return AgentCard(
        name="Ecommerce Dashboard Agent",
        description=(
            "This agent visualizes ecommerce data, showing sales breakdowns, YOY"
            " revenue performance, and regional sales outliers."
        ),
        url=self.base_url,
        version="1.0.0",
        default_input_modes=RizzchartsAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=RizzchartsAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=AgentCapabilities(
            streaming=True,
            extensions=[self.schema_manager.get_agent_extension()],
        ),
        skills=[
            AgentSkill(
                id="view_sales_by_category",
                name="View Sales by Category",
                description=(
                    "Displays a pie chart of sales broken down by product category for"
                    " a given time period."
                ),
                tags=["sales", "breakdown", "category", "pie chart", "revenue"],
                examples=[
                    "show my sales breakdown by product category for q3",
                    "What's the sales breakdown for last month?",
                ],
            ),
            AgentSkill(
                id="view_regional_outliers",
                name="View Regional Sales Outliers",
                description=(
                    "Displays a map showing regional sales outliers or store-level"
                    " performance."
                ),
                tags=["sales", "regional", "outliers", "stores", "map", "performance"],
                examples=[
                    "interesting. were there any outlier stores",
                    "show me a map of store performance",
                ],
            ),
        ],
    )
