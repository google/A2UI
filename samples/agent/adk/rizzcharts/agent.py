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

from a2ui.extension.a2ui_extension import STANDARD_CATALOG_ID
from a2ui.extension.a2ui_schema_utils import wrap_as_json_array
from a2ui.extension.send_a2ui_to_client_toolset import SendA2uiToClientToolset, A2uiEnabledProvider, A2uiSchemaProvider
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
A2UI_CATALOG_URI_STATE_KEY = "user:a2ui_catalog_uri"


class RizzchartsAgent(LlmAgent):
  """An agent that runs an ecommerce dashboard"""

  SUPPORTED_CONTENT_TYPES: ClassVar[list[str]] = ["text", "text/plain"]
  _a2ui_enabled_provider: A2uiEnabledProvider = PrivateAttr()
  _a2ui_schema_provider: A2uiSchemaProvider = PrivateAttr()

  def __init__(
      self,
      model: Any,
      a2ui_enabled_provider: A2uiEnabledProvider,
      a2ui_schema_provider: A2uiSchemaProvider,
  ):
    """Initializes the RizzchartsAgent.

    Args:
        model: The LLM model to use.
        a2ui_enabled_provider: A provider to check if A2UI is enabled.
        a2ui_schema_provider: A provider to retrieve the A2UI schema.
    """
    super().__init__(
        model=model,
        name="rizzcharts_agent",
        description="An agent that lets sales managers request sales data.",
        instruction=self.get_instructions,
        tools=[
            get_store_sales,
            get_sales_data,
            SendA2uiToClientToolset(
                a2ui_schema=a2ui_schema_provider,
                a2ui_enabled=a2ui_enabled_provider,
            ),
        ],
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
            )
        ),
        disallow_transfer_to_peers=True,
    )

    self._a2ui_enabled_provider = a2ui_enabled_provider
    self._a2ui_schema_provider = a2ui_schema_provider

  def get_a2ui_schema(self, ctx: ReadonlyContext) -> dict[str, Any]:
    """Retrieves and wraps the A2UI schema from the session state.

    Args:
        ctx: The ReadonlyContext for resolving the schema.

    Returns:
        The wrapped A2UI schema.
    """
    a2ui_schema = self._a2ui_schema_provider(ctx)
    return wrap_as_json_array(a2ui_schema)

  def load_example(self, path: str, a2ui_schema: dict[str, Any]) -> dict[str, Any]:
    """Loads an example JSON file and validates it against the A2UI schema.

    Args:
        path: Relative path to the example JSON file.
        a2ui_schema: The A2UI schema to validate against.

    Returns:
        The loaded and validated JSON data.
    """
    data = None
    try:
      # Try pkgutil first (for Google3)
      package_name = __package__ or ""
      data = pkgutil.get_data(package_name, path)
    except ImportError:
      logger.info("pkgutil failed to get data, falling back to file system.")

    if data:
      example_str = data.decode("utf-8")
    else:
      # Fallback to direct Path relative to this file (for local dev)
      full_path = Path(__file__).parent / path
      example_str = full_path.read_text()

    example_json = json.loads(example_str)
    jsonschema.validate(instance=example_json, schema=a2ui_schema)
    return example_json

  def get_instructions(self, readonly_context: ReadonlyContext) -> str:
    """Generates the system instructions for the agent.

    Args:
        readonly_context: The ReadonlyContext for resolving instructions.

    Returns:
        The generated system instructions.
    """
    use_ui = self._a2ui_enabled_provider(readonly_context)
    if not use_ui:
      raise ValueError("A2UI must be enabled to run rizzcharts agent")

    a2ui_schema = self.get_a2ui_schema(readonly_context)
    catalog_uri = readonly_context.state.get(A2UI_CATALOG_URI_STATE_KEY)
    if catalog_uri == RIZZCHARTS_CATALOG_URI:
      map_example = self.load_example(
          "examples/rizzcharts_catalog/map.json", a2ui_schema
      )
      chart_example = self.load_example(
          "examples/rizzcharts_catalog/chart.json", a2ui_schema
      )
    elif catalog_uri == STANDARD_CATALOG_ID:
      map_example = self.load_example("examples/standard_catalog/map.json", a2ui_schema)
      chart_example = self.load_example(
          "examples/standard_catalog/chart.json", a2ui_schema
      )
    else:
      raise ValueError(
          f"Unsupported catalog uri: {catalog_uri if catalog_uri else 'None'}"
      )

    final_prompt = f"""
### System Instructions

You are an expert A2UI Ecommerce Dashboard analyst. Your primary function is to translate user requests for ecommerce data into A2UI JSON payloads to display charts and visualizations. You MUST use the `send_a2ui_json_to_client` tool with the `a2ui_json` argument set to the A2UI JSON payload to send to the client. You should also include a brief text message with each response saying what you did and asking if you can help with anything else.

**Core Objective:** To provide a dynamic and interactive dashboard by constructing UI surfaces with the appropriate visualization components based on user queries.

**Key Components & Examples:**

You will be provided a schema that defines the A2UI message structure and two key generic component templates for displaying data.

1.  **Charts:** Used for requests about sales breakdowns, revenue performance, comparisons, or trends.
    * **Template:** Use the JSON from `---BEGIN CHART EXAMPLE---`.
2.  **Maps:** Used for requests about regional data, store locations, geography-based performance, or regional outliers.
    * **Template:** Use the JSON from `---BEGIN MAP EXAMPLE---`.

You will also use layout components like `Column` (as the `root`) and `Text` (to provide a title).

---

### Workflow and Rules

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

---BEGIN CHART EXAMPLE---
{json.dumps(chart_example)}
---END CHART EXAMPLE---

---BEGIN MAP EXAMPLE---
{json.dumps(map_example)}
---END MAP EXAMPLE---
"""

    logger.info(
        f"Generated system instructions for A2UI {'ENABLED' if use_ui else 'DISABLED'}"
        f" and catalog {catalog_uri}"
    )

    return final_prompt
