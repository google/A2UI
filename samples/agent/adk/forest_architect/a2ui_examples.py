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

"""A2UI examples for the Forest Architect agent."""

FOREST_UI_EXAMPLES = """
--- FOREST_DESIGN_EXAMPLE ---
This example renders a forest design result with metrics and recommendations:

[
  {
    "surfaceId": "forest-result",
    "beginRendering": {
      "root": "result_root",
      "styles": { "primaryColor": "#2E7D32" }
    }
  },
  {
    "surfaceId": "forest-result",
    "surfaceUpdate": {
      "components": [
        {
          "id": "result_root",
          "component": {
            "Column": {
              "children": { "explicitList": ["title", "metrics_card", "species_card", "action_btn"] },
              "alignment": "stretch"
            }
          }
        },
        {
          "id": "title",
          "component": {
            "Text": {
              "usageHint": "h2",
              "text": { "literalString": "🌳 Your Forest Design" }
            }
          }
        },
        {
          "id": "metrics_card",
          "component": {
            "Card": { "child": "metrics_content" }
          }
        },
        {
          "id": "metrics_content",
          "component": {
            "Column": {
              "children": { "explicitList": ["trees_text", "co2_text", "cost_text"] },
              "alignment": "start"
            }
          }
        },
        {
          "id": "trees_text",
          "component": {
            "Text": {
              "usageHint": "h3",
              "text": { "literalString": "🌲 3,200 trees" }
            }
          }
        },
        {
          "id": "co2_text",
          "component": {
            "Text": {
              "usageHint": "body",
              "text": { "literalString": "🌿 64 tons CO2/year sequestration" }
            }
          }
        },
        {
          "id": "cost_text",
          "component": {
            "Text": {
              "usageHint": "body",
              "text": { "literalString": "💰 ₹156 per tree" }
            }
          }
        },
        {
          "id": "species_card",
          "component": {
            "Card": { "child": "species_content" }
          }
        },
        {
          "id": "species_content",
          "component": {
            "Column": {
              "children": { "explicitList": ["species_title", "canopy_text", "subcanopy_text", "shrub_text"] },
              "alignment": "start"
            }
          }
        },
        {
          "id": "species_title",
          "component": {
            "Text": {
              "usageHint": "h4",
              "text": { "literalString": "Recommended Species" }
            }
          }
        },
        {
          "id": "canopy_text",
          "component": {
            "Text": {
              "usageHint": "body",
              "text": { "literalString": "Canopy (40%): Banyan, Neem, Pongamia" }
            }
          }
        },
        {
          "id": "subcanopy_text",
          "component": {
            "Text": {
              "usageHint": "body",
              "text": { "literalString": "Sub-canopy (35%): Golden Shower, Gulmohar" }
            }
          }
        },
        {
          "id": "shrub_text",
          "component": {
            "Text": {
              "usageHint": "body",
              "text": { "literalString": "Shrubs (25%): Hibiscus, Oleander, Jasmine" }
            }
          }
        },
        {
          "id": "action_btn",
          "component": {
            "Button": {
              "child": "action_btn_text",
              "primary": true,
              "action": {
                "name": "generate_proposal"
              }
            }
          }
        },
        {
          "id": "action_btn_text",
          "component": {
            "Text": { "text": { "literalString": "Generate Proposal" } }
          }
        }
      ]
    }
  }
]

--- SIMPLE_INFO_EXAMPLE ---
This example shows simple information like species recommendations:

[
  {
    "surfaceId": "info-card",
    "beginRendering": {
      "root": "info_root",
      "styles": { "primaryColor": "#2E7D32" }
    }
  },
  {
    "surfaceId": "info-card",
    "surfaceUpdate": {
      "components": [
        {
          "id": "info_root",
          "component": {
            "Card": { "child": "info_content" }
          }
        },
        {
          "id": "info_content",
          "component": {
            "Column": {
              "children": { "explicitList": ["info_title", "info_body"] },
              "alignment": "start"
            }
          }
        },
        {
          "id": "info_title",
          "component": {
            "Text": {
              "usageHint": "h3",
              "text": { "literalString": "🌿 Miyawaki Method Benefits" }
            }
          }
        },
        {
          "id": "info_body",
          "component": {
            "Text": {
              "usageHint": "body",
              "text": { "literalString": "The Miyawaki method creates dense native forests that grow 10x faster and are 30x denser than conventional plantations. Benefits include rapid biodiversity development, carbon sequestration, and minimal maintenance after 3 years." }
            }
          }
        }
      ]
    }
  }
]
"""
