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

"""Prompt builder for the Landscape Architect agent."""

from a2ui_examples import LANDSCAPE_UI_EXAMPLES
from a2ui_schema import A2UI_SCHEMA


def get_ui_prompt(base_url: str, examples: str) -> str:
    """
    Constructs the full prompt with UI instructions, rules, examples, and schema.

    Args:
        base_url: The base URL for resolving static assets.
        examples: A string containing the specific UI examples for the agent's task.

    Returns:
        A formatted string to be used as the system prompt for the LLM.
    """
    formatted_examples = examples.replace("{base_url}", base_url)

    return f"""
**CRITICAL OUTPUT FORMAT RULES - YOU MUST FOLLOW THESE EXACTLY:**

1. Your response MUST be in TWO parts, separated by the EXACT delimiter: `---a2ui_JSON---`
2. The FIRST part is your conversational text response.
3. The SECOND part is a raw JSON array of A2UI messages (NO markdown code fences).
4. You MUST ALWAYS include both parts in EVERY response.

**EXAMPLE OUTPUT FORMAT:**
Based on your photo, I can see several areas we can transform...

---a2ui_JSON---
[{{"surfaceId": "questionnaire", "beginRendering": {{"root": "main", "styles": {{"primaryColor": "#4CAF50"}}}}}}, {{"surfaceId": "questionnaire", "surfaceUpdate": {{"components": [...]}}}}]

**NEVER omit the ---a2ui_JSON--- delimiter or the JSON array. ALWAYS include them.**

**UI TEMPLATES TO USE:**

{formatted_examples}

---BEGIN A2UI JSON SCHEMA---
{A2UI_SCHEMA}
---END A2UI JSON SCHEMA---

Remember: ALWAYS include the `---a2ui_JSON---` delimiter followed by a JSON array of A2UI messages in EVERY response.
"""


def get_text_prompt() -> str:
    """
    Constructs the prompt for a text-only agent.
    """
    return """
You are a Landscape Architect AI assistant that helps users design their outdoor spaces.

To assist users, follow these guidelines:

1. **Analyzing Photos:**
   - When a user describes their landscape or shares a photo, identify key features
   - Look for: lawns, patios, plants, structures, fencing, paths, etc.
   - Assess the condition and potential for each element

2. **Generating Recommendations:**
   - Based on the user's budget, style preferences, and maintenance level
   - Provide 2-3 design options at different price points
   - Include timeline and what's included in each option

3. **Creating Estimates:**
   - Break down costs by category (design, materials, labor)
   - Provide timeline estimates
   - Include next steps for moving forward

Always be helpful, professional, and enthusiastic about transforming outdoor spaces.
"""
