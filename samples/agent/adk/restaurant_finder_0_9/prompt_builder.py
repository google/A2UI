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

# A2UI v0.9 Schema for LLM Prompt and Validation
# This schema combines server_to_client.json and a condensed standard_catalog.json
A2UI_SCHEMA = r'''
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "A2UI Message Schema",
  "description": "Describes a JSON payload for an A2UI (Agent to UI) message. A message MUST contain exactly ONE of the keys: 'createSurface', 'updateComponents', 'updateDataModel', or 'deleteSurface'.",
  "type": "object",
  "oneOf": [
    { "$ref": "#/$defs/CreateSurfaceMessage" },
    { "$ref": "#/$defs/UpdateComponentsMessage" },
    { "$ref": "#/$defs/UpdateDataModelMessage" },
    { "$ref": "#/$defs/DeleteSurfaceMessage" }
  ],
  "$defs": {
    "CreateSurfaceMessage": {
      "type": "object",
      "properties": {
        "createSurface": {
          "type": "object",
          "properties": {
            "surfaceId": { "type": "string" },
            "catalogId": { "type": "string" },
            "theme": { "type": "object" },
            "sendDataModel": { "type": "boolean" }
          },
          "required": ["surfaceId", "catalogId"]
        }
      },
      "required": ["createSurface"]
    },
    "UpdateComponentsMessage": {
      "type": "object",
      "properties": {
        "updateComponents": {
          "type": "object",
          "properties": {
            "surfaceId": { "type": "string" },
            "components": {
              "type": "array",
              "items": { "$ref": "#/$defs/Component" }
            }
          },
          "required": ["surfaceId", "components"]
        }
      },
      "required": ["updateComponents"]
    },
    "UpdateDataModelMessage": {
      "type": "object",
      "properties": {
        "updateDataModel": {
          "type": "object",
          "properties": {
            "surfaceId": { "type": "string" },
            "path": { "type": "string" },
            "value": { "description": "The value to set at the path. If omitted, the key is removed." }
          },
          "required": ["surfaceId"]
        }
      },
      "required": ["updateDataModel"]
    },
    "DeleteSurfaceMessage": {
      "type": "object",
      "properties": {
        "deleteSurface": {
          "type": "object",
          "properties": {
            "surfaceId": { "type": "string" }
          },
          "required": ["surfaceId"]
        }
      },
      "required": ["deleteSurface"]
    },
    "ComponentId": { "type": "string" },
    "DynamicString": { "description": "String, data path (e.g. ${data-path}), or formatString", "type": "string" },
    "ChildList": {
        "oneOf": [
            { "type": "array", "items": { "$ref": "#/$defs/ComponentId" } },
            { 
                "type": "object", 
                "properties": { 
                    "componentId": { "$ref": "#/$defs/ComponentId" },
                    "path": { "type": "string" }
                },
                "required": ["componentId", "path"]
            }
        ]
    },
    "Component": {
      "type": "object",
      "properties": {
        "id": { "$ref": "#/$defs/ComponentId" },
        "component": { "type": "string" }
      },
      "required": ["id", "component"],
      "allOf": [
        {
          "if": { "properties": { "component": { "const": "Column" } } },
          "then": {
            "properties": {
              "children": { "$ref": "#/$defs/ChildList" },
              "justify": { "enum": ["start", "center", "end", "spaceBetween", "spaceAround", "spaceEvenly", "stretch"] },
              "align": { "enum": ["center", "end", "start", "stretch"] }
            },
            "required": ["children"]
          }
        },
        {
          "if": { "properties": { "component": { "const": "Row" } } },
          "then": {
            "properties": {
              "children": { "$ref": "#/$defs/ChildList" },
              "justify": { "enum": ["center", "end", "spaceAround", "spaceBetween", "spaceEvenly", "start", "stretch"] },
              "align": { "enum": ["start", "center", "end", "stretch"] }
            },
            "required": ["children"]
          }
        },
        {
          "if": { "properties": { "component": { "const": "Text" } } },
          "then": {
            "properties": {
              "text": { "$ref": "#/$defs/DynamicString" },
              "variant": { "enum": ["h1", "h2", "h3", "h4", "h5", "caption", "body"] }
            },
            "required": ["text"]
          }
        },
        {
          "if": { "properties": { "component": { "const": "Button" } } },
          "then": {
            "properties": {
              "child": { "$ref": "#/$defs/ComponentId" },
              "variant": { "enum": ["primary", "borderless"] },
              "action": { "type": "object", "required": ["event"] }
            },
            "required": ["child", "action"]
          }
        },
        {
          "if": { "properties": { "component": { "const": "Image" } } },
          "then": {
            "properties": {
              "url": { "$ref": "#/$defs/DynamicString" },
              "fit": { "enum": ["contain", "cover", "fill", "none", "scale-down"] }
            },
            "required": ["url"]
          }
        },
        {
          "if": { "properties": { "component": { "const": "List" } } },
          "then": {
            "properties": {
              "children": { "$ref": "#/$defs/ChildList" },
              "direction": { "enum": ["vertical", "horizontal"] }
            },
            "required": ["children"]
          }
        },
        {
          "if": { "properties": { "component": { "const": "Card" } } },
          "then": {
             "properties": {
               "child": { "$ref": "#/$defs/ComponentId" }
             },
             "required": ["child"]
          }
        },
        {
           "if": { "properties": { "component": { "const": "TextField" } } },
           "then": {
             "properties": {
               "label": { "$ref": "#/$defs/DynamicString" },
               "value": { "$ref": "#/$defs/DynamicString" }
             },
             "required": ["label"]
           }
        }
      ]
    }
  }
}
'''

from a2ui_examples import RESTAURANT_UI_EXAMPLES


def get_text_prompt() -> str:
    """Returns the prompt for text-only mode."""
    return """
    You are a helpful assistant. Provide clear and concise text responses to the user's questions.
    """


def get_ui_prompt(base_url: str, examples: str) -> str:
    """
    Constructs the full system prompt for the A2UI v0.9 agent.
    """
    return f"""
    You are an AI assistant powered by the A2UI v0.9 Protocol.
    Your goal is to generate rich, dynamic user interfaces JSON based on user requests.

    ### A2UI v0.9 Protocol Rules
    1.  **Response Format**: You MUST respond with a JSON list of A2UI messages.
    2.  **Message Types**:
        - `createSurface`: Initializes a new UI surface.
        - `updateComponents`: Adds or updates components on the surface.
        - `updateDataModel`: Updates the data bound to the components.
    3.  **Component flattening**: Components are defined as flat objects with a `component` string property (e.g., `"component": "Text"`).
    4.  **Composition**: Container components (Row, Column) reference children by ID string in a `children` array.
    5.  **Data Binding**: Use `${{data-path}}` or `${{/data-path}}` syntax for data binding in strings.

    ### Schema
    Use the following standard catalog schema as a reference for valid components:
    https://a2ui.org/specification/v0_9/standard_catalog.json

    ### Examples
    Below are examples of valid A2UI v0.9 responses. Use these as templates.

    {examples}

    ### Task
    Generate the A2UI JSON response for the user's request.
    Wrapp the JSON in a code block with the delimiter strictly:
    ---a2ui_JSON---
    ```json
    [ ... your messages ... ]
    ```
    """
