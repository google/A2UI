# Copyright 2026 Google LLC
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

"""Enterprise analytics dashboard agent.

Demonstrates compact, visual-first A2UI output patterns for data-dense
enterprise use cases. Run with: adk web
"""

import os

from google.adk.agents.llm_agent import LlmAgent
from google.adk.models import Gemini
from .prompt_builder import get_dashboard_prompt
from .tools import get_kpi_summary, get_store_comparison, get_product_rankings

model_name = os.getenv("MODEL_NAME", "gemini-2.0-flash")

root_agent = LlmAgent(
    model=Gemini(model=model_name),
    name="enterprise_dashboard",
    description=(
        "Visual-first analytics dashboard that renders business data as "
        "compact A2UI component layouts instead of text."
    ),
    instruction=get_dashboard_prompt(),
    tools=[get_kpi_summary, get_store_comparison, get_product_rankings],
)
