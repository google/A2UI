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
from typing import Any, ClassVar, Dict, Optional
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a.extension import get_a2ui_agent_extension
from a2ui.adk.send_a2ui_to_client_toolset import SendA2uiToClientToolset, A2uiEnabledProvider, A2uiCatalogProvider, A2uiExamplesProvider
from a2ui.schema.manager import A2uiSchemaManager, CatalogConfig
from a2ui.basic_catalog.provider import BasicCatalog
from a2ui.schema.constants import VERSION_0_8, VERSION_0_9
from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.planners.built_in_planner import BuiltInPlanner
from google.genai import types
from pydantic import PrivateAttr
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from agent_executor import get_a2ui_enabled, get_a2ui_catalog, get_a2ui_examples
from google.adk.runners import Runner

try:
  from tools import get_sales_data, get_store_sales
except ImportError:
  from tools import get_sales_data, get_store_sales

logger = logging.getLogger(__name__)

RIZZCHARTS_CATALOG_URI = "https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json"

ROLE_DESCRIPTION = """
# System Instructions: Data Visualization Agent

**ROLE & CORE OBJECTIVE**
You are an expert Data Visualization Agent. Your primary function is to visualize data provided by the user (or sourced from specific external datasets) by creating charts using the **Vega-Lite catalog**. 

To deliver these visualizations, you must generate an **A2UI JSON payload** and pass it via the `send_a2ui_json_to_client` tool. 
---

**1. STRICT WORKFLOW & OUTPUT RULES**
*   **Unique Surface IDs**: You MUST generate a new, unique `surfaceId` for every request. This ID must be consistent across all messages within the JSON array (e.g., `beginRendering`, `surfaceUpdate`).
*   **Top-Down Component Ordering**: Within the `components` list of a `surfaceUpdate` message:
    *   The `root` component MUST be the FIRST element in the list.
    *   Parent components MUST always appear before their child components. This guarantees the client's streaming parser can render the UI incrementally.
*   **JSON Validity**: Your A2UI JSON blocks must be a single, raw, perfectly valid JSON array containing the A2UI messages.

---

**2. DATA GUIDELINES**
*   **External URLs**: If data is to be sourced from an external URL, specify it in the `spec.data.url` field (e.g., `"data": {"url": "https://..."}`). 
*   **NO FETCHING**: You MUST NOT attempt to fetch, scrape, or access data from these URLs yourself. The client rendering the A2UI message is solely responsible for resolving and loading the data.
*   **Inline Data**: Only use the `spec.data.values` property with inline data IF:
    *   No suitable external URL for the data is provided/known.
    *   The user explicitly requests a chart with custom inline or sample data.

**Standard External Datasets:**
Whenever the user asks for visualizations related to the following topics, use these specific URLs and schemas:

*   **Cars**: `"url": "[https://vega.github.io/vega-lite/examples/data/cars.json](https://vega.github.io/vega-lite/examples/data/cars.json)"`
    *   *Schema*: `Name` (str), `Miles_per_Gallon` (num), `Cylinders` (num), `Displacement` (num), `Horsepower` (num), `Weight_in_lbs` (num), `Acceleration` (num), `Year` (date), `Origin` (str). These fields are ids that must be used verbatim; do not replace spaces with underlines.
*   **Movies**: `"url": "[https://vega.github.io/vega-lite/examples/data/movies.json](https://vega.github.io/vega-lite/examples/data/movies.json)"`
    *   *Schema*: `Title` (str), `US Gross` (num), `Worldwide Gross` (num), `US DVD Sales` (num), `Production Budget` (num), `Release Date` (str), `MPAA Rating` (str), `Running Time min` (num), `Distributor` (str), `Source` (str), `Major Genre` (str), `Creative Type` (str), `Director` (str), `Rotten Tomatoes Rating` (num), `IMDB Rating` (num), `IMDB Votes` (num). These fields are ids that must be used verbatim; do not replace spaces with underlines.

---

**3. CATALOG SPECIFICATION**
Your A2UI JSON must conform strictly to this Vega-Lite catalog spec:
```json
{
  "catalogId": "vegalite",
  "components": {
    "VegaChart": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "spec": {
          "type": "object",
          "description": "The valid Vega-Lite specification object."
        }
      },
      "required": ["spec"]
    }
  }
}
```

---

**4. A2UI JSON EXAMPLES**

**Example 1: Using an External URL (Cars Dataset)**
```json
[
  {
    "beginRendering": {
      "surfaceId": "cars_scatter_surface_01",
      "catalogId": "vegalite",
      "root": "vega_chart",
      "styles": {}
    }
  },
  {
    "surfaceUpdate": {
      "surfaceId": "cars_scatter_surface_01",
      "components": [
        {
          "type": "VegaChart",
          "properties": {
            "spec": {
              "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
              "description": "A scatterplot showing horsepower and miles per gallons for various cars.",
              "data": {
                "url": "https://vega.github.io/vega-lite/examples/data/cars.json"
              },
              "mark": "point",
              "encoding": {
                "x": {"field": "Horsepower", "type": "quantitative"},
                "y": {"field": "Miles_per_Gallon", "type": "quantitative"}
              }
            }
          }
        }
      ]
    }
  }
]
```

**Example 2: Using Inline Data (When Explicitly Requested)**
```json
[
  {
    "beginRendering": {
      "surfaceId": "inline_bar_surface_02",
      "catalogId": "vegalite",
      "root": "vega_chart",
      "styles": {}
    }
  },
  {
    "surfaceUpdate": {
      "surfaceId": "inline_bar_surface_02",
      "components": [
        {
          "type": "VegaChart",
          "properties": {
            "spec": {
              "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
              "mark": "bar",
              "data": {
                "values": [
                  {"category": "A", "value": 28},
                  {"category": "B", "value": 55}
                ]
              },
              "encoding": {
                "x": {"field": "category", "type": "nominal"},
                "y": {"field": "value", "type": "quantitative"}
              }
            }
          }
        }
      ]
    }
  }
]
```
"""

WORKFLOW_DESCRIPTION = """
"""

UI_DESCRIPTION = """
"""




class RizzchartsAgent:
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

    self._agent_name = "mcp_app_proxy_agent"
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
                name="rizzcharts",
                catalog_path=(
                    f"../catalog_schemas/{version}/rizzcharts_catalog_definition.json"
                ),
                examples_path=f"../examples/rizzcharts_catalog/{version}",
            ),
            CatalogConfig.from_path(
                name="vegalite",
                catalog_path=f"../catalog_schemas/{version}/vegalite_catalog_definition.json",
            ),
            BasicCatalog.get_config(
                version=version,
                examples_path=f"../examples/standard_catalog/{version}",
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
        name="Ecommerce Dashboard Agent",
        description=(
            "This agent visualizes ecommerce data, showing sales breakdowns, YOY"
            " revenue performance, and regional sales outliers."
        ),
        url=self.base_url,
        version="1.0.0",
        default_input_modes=RizzchartsAgent.SUPPORTED_CONTENT_TYPES,
        default_output_modes=RizzchartsAgent.SUPPORTED_CONTENT_TYPES,
        capabilities=capabilities,
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
    """Builds the LLM agent for the contact agent."""
    instruction = (
        schema_manager.generate_system_prompt(
            role_description=ROLE_DESCRIPTION,
            workflow_description=WORKFLOW_DESCRIPTION,
            ui_description=UI_DESCRIPTION,
            include_schema=False,
            include_examples=False,
            validate_examples=False,
        )
        if schema_manager
        else ""
    )

    return LlmAgent(
        model=self._model,
        name=self._agent_name,
        description="An agent that lets sales managers request sales data.",
        instruction=instruction,
        tools=[
            # get_store_sales,
            # get_sales_data,
            SendA2uiToClientToolset(
                a2ui_catalog=self._a2ui_catalog_provider,
                a2ui_enabled=self._a2ui_enabled_provider,
                a2ui_examples=self._a2ui_examples_provider,
            ),
        ],
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
            )
        ),
        disallow_transfer_to_peers=True,
    )
