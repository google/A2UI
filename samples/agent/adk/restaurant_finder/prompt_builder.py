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

import os
from a2ui.core.schema.constants import VERSION_0_9
from a2ui.core.schema.manager import A2uiSchemaManager
from a2ui.basic_catalog.provider import BasicCatalog
from a2ui.core.schema.common_modifiers import remove_strict_validation

ROLE_DESCRIPTION = (
    "You are a helpful restaurant finding assistant. Your final output MUST be a a2ui"
    " UI JSON response."
)

UI_DESCRIPTION_V0_9 = """
-   If the query is for a list of restaurants, use the restaurant data you have already received from the `get_restaurants` tool to populate the `updateDataModel.value` object (e.g., for the "items" key).
-   If the number of restaurants is 5 or fewer, you MUST use the `SINGLE_COLUMN_LIST_EXAMPLE` template.
-   If the number of restaurants is more than 5, you MUST use the `TWO_COLUMN_LIST_EXAMPLE` template.
-   If the query is to book a restaurant (e.g., "USER_WANTS_TO_BOOK..."), you MUST use the `BOOKING_FORM_EXAMPLE` template.
-   If the query is a booking submission (e.g., "User submitted a booking..."), you MUST use the `CONFIRMATION_EXAMPLE` template.
"""

UI_DESCRIPTION_V0_8 = """
-   If the query is for a list of restaurants, use the restaurant data you have already received from the `get_restaurants` tool to populate the `dataModelUpdate.contents` array.
-   If the number of restaurants is 5 or fewer, you MUST use the `SINGLE_COLUMN_LIST_EXAMPLE` template.
-   If the number of restaurants is more than 5, you MUST use the `TWO_COLUMN_LIST_EXAMPLE` template.
-   If the query is to book a restaurant (e.g., "USER_WANTS_TO_BOOK..."), you MUST use the `BOOKING_FORM_EXAMPLE` template.
-   If the query is a booking submission (e.g., "User submitted a booking..."), you MUST use the `CONFIRMATION_EXAMPLE` template.
"""


def get_text_prompt() -> str:
  """
  Constructs the prompt for a text-only agent.
  """
  return """
    You are a helpful restaurant finding assistant. Your final output MUST be a text response.

    To generate the response, you MUST follow these rules:
    1.  **For finding restaurants:**
        a. You MUST call the `get_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query.
        b. After receiving the data, format the restaurant list as a clear, human-readable text response. You MUST preserve any markdown formatting (like for links) that you receive from the tool.

    2.  **For booking a table (when you receive a query like 'USER_WANTS_TO_BOOK...'):**
        a. Respond by asking the user for the necessary details to make a booking (party size, date, time, dietary requirements).

    3.  **For confirming a booking (when you receive a query like 'User submitted a booking...'):**
        a. Respond with a simple text confirmation of the booking details.
    """


if __name__ == "__main__":
  from a2ui.core.schema.constants import VERSION_0_9, VERSION_0_8
  
  for version in [VERSION_0_8, VERSION_0_9]:
    ui_desc = UI_DESCRIPTION_V0_8 if version == VERSION_0_8 else UI_DESCRIPTION_V0_9
    examples_path = f"v{version.replace('.', '_')}/examples"
    
    # We must check if the path exists before running this (since it's relative)
    # This is mainly for manual verification in the script
    if not os.path.exists(examples_path):
        examples_path = f"samples/agent/adk/restaurant_finder/{examples_path}"

    restaurant_prompt = A2uiSchemaManager(
        version,
        catalogs=[
            BasicCatalog.get_config(
                version=version,
                examples_path=examples_path,
            )
        ],
        schema_modifiers=[remove_strict_validation],
    ).generate_system_prompt(
        role_description=ROLE_DESCRIPTION,
        ui_description=ui_desc,
        include_schema=True,
        include_examples=True,
        validate_examples=True,
    )

    print(f"\n--- GENERATED PROMPT FOR {version} ---\n")
    print(restaurant_prompt[:500] + "...")
