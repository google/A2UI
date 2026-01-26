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

from a2ui.inference.schema.manager import A2uiSchemaManager

ROLE_DESCRIPTION = (
    "You are a helpful contact lookup assistant. Your final output MUST be an A2UI JSON"
    " response."
)

WORKFLOW_DESCRIPTION = """
To generate the response, you MUST follow these rules:
1.  Your response MUST be in two parts, separated by the delimiter: `---a2ui_JSON---`.
2.  The first part is your conversational text response (e.g., "Here is the contact you requested...").
3.  The second part is a single, raw JSON object which is a list of A2UI messages.
4.  The JSON part MUST validate against the A2UI JSON SCHEMA provided below.
5.  Buttons that represent the main action on a card or view (e.g., 'Follow', 'Email', 'Search') SHOULD include the `"primary": true` attribute.
"""

UI_DESCRIPTION = """
-   **For finding contacts (e.g., "Who is Alex Jordan?"):**
    a.  You MUST call the `get_contact_info` tool.
    b.  If the tool returns a **single contact**, you MUST use the `CONTACT_CARD_EXAMPLE` template. Populate the `dataModelUpdate.contents` with the contact's details (name, title, email, etc.).
    c.  If the tool returns **multiple contacts**, you MUST use the `CONTACT_LIST_EXAMPLE` template. Populate the `dataModelUpdate.contents` with the list of contacts for the "contacts" key.
    d.  If the tool returns an **empty list**, respond with text only and an empty JSON list: "I couldn't find anyone by that name.---a2ui_JSON---[]"

-   **For handling a profile view (e.g., "WHO_IS: Alex Jordan..."):**
    a.  You MUST call the `get_contact_info` tool with the specific name.
    b.  This will return a single contact. You MUST use the `CONTACT_CARD_EXAMPLE` template.

-   **For handling actions (e.g., "follow_contact"):**
    a.  You MUST use the `FOLLOW_SUCCESS_EXAMPLE` template.
    b.  This will render a new card with a "Successfully Followed" message.
    c.  Respond with a text confirmation like "You are now following this contact." along with the JSON.
"""


def get_text_prompt() -> str:
  """
  Constructs the prompt for a text-only agent.
  """
  return """
    You are a helpful contact lookup assistant. Your final output MUST be a text response.

    To generate the response, you MUST follow these rules:
    1.  **For finding contacts:**
        a. You MUST call the `get_contact_info` tool. Extract the name and department from the user's query.
        b. After receiving the data, format the contact(s) as a clear, human-readable text response.
        c. If multiple contacts are found, list their names and titles.
        d. If one contact is found, list all their details.

    2.  **For handling actions (e.g., "USER_WANTS_TO_EMAIL: ..."):**
        a. Respond with a simple text confirmation (e.g., "Drafting an email to...").
    """


if __name__ == "__main__":
  # Example of how to use the A2UI Schema Manager to generate a system prompt
  contact_prompt = A2uiSchemaManager(
      "0.8", basic_examples_path="examples"
  ).generate_system_prompt(
      role_description=ROLE_DESCRIPTION,
      workflow_description=WORKFLOW_DESCRIPTION,
      ui_description=UI_DESCRIPTION,
      include_schema=True,
      include_examples=True,
      validate_examples=False,
  )
  print(contact_prompt)
  with open("generated_prompt.txt", "w") as f:
    f.write(contact_prompt)
  print("\nGenerated prompt saved to generated_prompt.txt")
