# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Defines the Component Gallery 'Kitchen Sink' example."""

import json
from typing import Optional
from a2ui.core.schema.constants import VERSION_0_8, VERSION_0_9


def get_gallery_json(version: Optional[str]) -> str:
  """Returns the JSON structure for the Component Gallery surfaces."""

  # Default to v0.8 if no version is provided
  if not version:
    version = VERSION_0_8

  if version == VERSION_0_9:
    return get_v0_9_gallery_json()
  else:
    return get_v0_8_gallery_json()


def get_v0_8_gallery_json() -> str:
  """Returns the JSON structure for the Component Gallery surfaces (v0.8)."""

  messages = []

  # Common Data Model for v0.8
  gallery_data_content = {
      "key": "galleryData",
      "valueMap": [
          {"key": "textField", "valueString": "Hello World"},
          {"key": "checkbox", "valueBoolean": False},
          {"key": "checkboxChecked", "valueBoolean": True},
          {"key": "slider", "valueNumber": 30},
          {"key": "date", "valueString": "2025-10-26"},
          {"key": "favorites", "valueMap": [{"key": "0", "valueString": "A"}]},
          {"key": "favoritesChips", "valueMap": []},
          {"key": "favoritesFilter", "valueMap": []},
      ],
  }

  # Helper to create a surface for a single component
  def add_demo_surface(surface_id, component_def):
    root_id = f"{surface_id}-root"

    messages.append(
        {
            "beginRendering": {
                "surfaceId": surface_id,
                "root": root_id,
            }
        }
    )
    messages.append({
        "surfaceUpdate": {
            "surfaceId": surface_id,
            "components": [{"id": root_id, "component": component_def}],
        }
    })
    messages.append({
        "dataModelUpdate": {
            "surfaceId": surface_id,
            "contents": [gallery_data_content],
        }
    })

  # 1. TextField
  add_demo_surface(
      "demo-text",
      {
          "TextField": {
              "label": {"literalString": "Enter some text"},
              "text": {"path": "galleryData/textField"},
          }
      },
  )

  # 1b. TextField (Regex)
  add_demo_surface(
      "demo-text-regex",
      {
          "TextField": {
              "label": {"literalString": "Enter exactly 5 digits"},
              "text": {"path": "galleryData/textFieldRegex"},
              "validationRegexp": "^\\d{5}$",
          }
      },
  )

  # 2. CheckBox
  add_demo_surface(
      "demo-checkbox",
      {
          "CheckBox": {
              "label": {"literalString": "Toggle me"},
              "value": {"path": "galleryData/checkbox"},
          }
      },
  )

  # 3. Slider
  add_demo_surface(
      "demo-slider",
      {
          "Slider": {
              "value": {"path": "galleryData/slider"},
              "minValue": 0,
              "maxValue": 100,
          }
      },
  )

  # 4. DateTimeInput
  add_demo_surface(
      "demo-date",
      {"DateTimeInput": {"value": {"path": "galleryData/date"}, "enableDate": True}},
  )

  # 5. MultipleChoice (Default)
  add_demo_surface(
      "demo-multichoice",
      {
          "MultipleChoice": {
              "selections": {"path": "galleryData/favorites"},
              "options": [
                  {"label": {"literalString": "Apple"}, "value": "A"},
                  {"label": {"literalString": "Banana"}, "value": "B"},
                  {"label": {"literalString": "Cherry"}, "value": "C"},
              ],
          }
      },
  )

  # 5b. MultipleChoice (Chips)
  add_demo_surface(
      "demo-multichoice-chips",
      {
          "MultipleChoice": {
              "selections": {"path": "galleryData/favoritesChips"},
              "description": "Select tags (Chips)",
              "variant": "chips",
              "options": [
                  {"label": {"literalString": "Work"}, "value": "work"},
                  {"label": {"literalString": "Home"}, "value": "home"},
                  {"label": {"literalString": "Urgent"}, "value": "urgent"},
                  {"label": {"literalString": "Later"}, "value": "later"},
              ],
          }
      },
  )

  # 5c. MultipleChoice (Filterable)
  add_demo_surface(
      "demo-multichoice-filter",
      {
          "MultipleChoice": {
              "selections": {"path": "galleryData/favoritesFilter"},
              "description": "Select countries (Filterable)",
              "filterable": True,
              "options": [
                  {"label": {"literalString": "United States"}, "value": "US"},
                  {"label": {"literalString": "Canada"}, "value": "CA"},
                  {"label": {"literalString": "United Kingdom"}, "value": "UK"},
                  {"label": {"literalString": "Australia"}, "value": "AU"},
                  {"label": {"literalString": "Germany"}, "value": "DE"},
                  {"label": {"literalString": "France"}, "value": "FR"},
                  {"label": {"literalString": "Japan"}, "value": "JP"},
              ],
          }
      },
  )

  # 6. Image
  add_demo_surface(
      "demo-image",
      {
          "Image": {
              "url": {"literalString": "http://localhost:10005/assets/a2ui.png"},
              "usageHint": "mediumFeature",
          }
      },
  )

  # 7. Button
  # Button needs a child Text component.
  button_surface_id = "demo-button"
  btn_root_id = "demo-button-root"
  btn_text_id = "demo-button-text"

  messages.append(
      {
          "beginRendering": {
              "surfaceId": button_surface_id,
              "root": btn_root_id,
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": button_surface_id,
          "components": [
              {
                  "id": btn_text_id,
                  "component": {"Text": {"text": {"literalString": "Trigger Action"}}},
              },
              {
                  "id": btn_root_id,
                  "component": {
                      "Button": {
                          "child": btn_text_id,
                          "primary": True,
                          "action": {
                              "name": "custom_action",
                              "context": [{
                                  "key": "info",
                                  "value": {"literalString": "Custom Button Clicked"},
                              }],
                          },
                      }
                  },
              },
          ],
      }
  })

  # 8. Tabs
  tabs_surface_id = "demo-tabs"
  tabs_root_id = "demo-tabs-root"
  tab1_id = "tab-1-content"
  tab2_id = "tab-2-content"

  messages.append(
      {
          "beginRendering": {
              "surfaceId": tabs_surface_id,
              "root": tabs_root_id,
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": tabs_surface_id,
          "components": [
              {
                  "id": tab1_id,
                  "component": {
                      "Text": {"text": {"literalString": "First Tab Content"}}
                  },
              },
              {
                  "id": tab2_id,
                  "component": {
                      "Text": {"text": {"literalString": "Second Tab Content"}}
                  },
              },
              {
                  "id": tabs_root_id,
                  "component": {
                      "Tabs": {
                          "tabItems": [
                              {
                                  "title": {"literalString": "View One"},
                                  "child": tab1_id,
                              },
                              {
                                  "title": {"literalString": "View Two"},
                                  "child": tab2_id,
                              },
                          ]
                      }
                  },
              },
          ],
      }
  })

  # 9. Icon
  icon_surface_id = "demo-icon"
  messages.append(
      {
          "beginRendering": {
              "surfaceId": icon_surface_id,
              "root": "icon-root",
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": icon_surface_id,
          "components": [
              {
                  "id": "icon-root",
                  "component": {
                      "Row": {
                          "children": {"explicitList": ["icon-1", "icon-2", "icon-3"]},
                          "distribution": "spaceEvenly",
                          "alignment": "center",
                      }
                  },
              },
              {
                  "id": "icon-1",
                  "component": {"Icon": {"name": {"literalString": "star"}}},
              },
              {
                  "id": "icon-2",
                  "component": {"Icon": {"name": {"literalString": "home"}}},
              },
              {
                  "id": "icon-3",
                  "component": {"Icon": {"name": {"literalString": "settings"}}},
              },
          ],
      }
  })

  # 10. Divider
  div_surface_id = "demo-divider"
  messages.append(
      {
          "beginRendering": {
              "surfaceId": div_surface_id,
              "root": "div-root",
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": div_surface_id,
          "components": [
              {
                  "id": "div-root",
                  "component": {
                      "Column": {
                          "children": {
                              "explicitList": ["div-text-1", "div-horiz", "div-text-2"]
                          },
                          "distribution": "start",
                          "alignment": "stretch",
                      }
                  },
              },
              {
                  "id": "div-text-1",
                  "component": {"Text": {"text": {"literalString": "Above Divider"}}},
              },
              {"id": "div-horiz", "component": {"Divider": {"axis": "horizontal"}}},
              {
                  "id": "div-text-2",
                  "component": {"Text": {"text": {"literalString": "Below Divider"}}},
              },
          ],
      }
  })

  # 11. Card
  card_surface_id = "demo-card"
  messages.append(
      {
          "beginRendering": {
              "surfaceId": card_surface_id,
              "root": "card-root",
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": card_surface_id,
          "components": [
              {"id": "card-root", "component": {"Card": {"child": "card-text"}}},
              {
                  "id": "card-text",
                  "component": {
                      "Text": {"text": {"literalString": "I am inside a Card"}}
                  },
              },
          ],
      }
  })

  # 12. Video
  add_demo_surface(
      "demo-video",
      {
          "Video": {
              # Still external as user only provided audio and image
              "url": {
                  "literalString": (
                      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  )
              }
          }
      },
  )

  # 13. Modal
  # Modal needs an entry point (Button) and content.
  modal_surface_id = "demo-modal"
  messages.append(
      {
          "beginRendering": {
              "surfaceId": modal_surface_id,
              "root": "modal-root",
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": modal_surface_id,
          "components": [
              {
                  "id": "modal-root",
                  "component": {
                      "Modal": {
                          "entryPointChild": "modal-btn",
                          "contentChild": "modal-content",
                      }
                  },
              },
              {
                  "id": "modal-btn",
                  "component": {
                      "Button": {
                          "child": "modal-btn-text",
                          "primary": False,
                          "action": {"name": "noop"},
                      }
                  },
              },
              {
                  "id": "modal-btn-text",
                  "component": {"Text": {"text": {"literalString": "Open Modal"}}},
              },
              {
                  "id": "modal-content",
                  "component": {
                      "Text": {"text": {"literalString": "This is the modal content!"}}
                  },
              },
          ],
      }
  })

  # 14. List
  list_surface_id = "demo-list"
  messages.append(
      {
          "beginRendering": {
              "surfaceId": list_surface_id,
              "root": "list-root",
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": list_surface_id,
          "components": [
              {
                  "id": "list-root",
                  "component": {
                      "List": {
                          "children": {
                              "explicitList": [
                                  "list-item-1",
                                  "list-item-2",
                                  "list-item-3",
                              ]
                          },
                          "direction": "vertical",
                          "alignment": "stretch",
                      }
                  },
              },
              {
                  "id": "list-item-1",
                  "component": {"Text": {"text": {"literalString": "Item 1"}}},
              },
              {
                  "id": "list-item-2",
                  "component": {"Text": {"text": {"literalString": "Item 2"}}},
              },
              {
                  "id": "list-item-3",
                  "component": {"Text": {"text": {"literalString": "Item 3"}}},
              },
          ],
      }
  })

  # 15. AudioPlayer
  add_demo_surface(
      "demo-audio",
      {
          "AudioPlayer": {
              "url": {"literalString": "http://localhost:10005/assets/audio.mp3"},
              "description": {"literalString": "Local Audio Sample"},
          }
      },
  )

  # Response Surface
  resp_surface_id = "response-surface"
  messages.append(
      {
          "beginRendering": {
              "surfaceId": resp_surface_id,
              "root": "response-text",
          }
      }
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": resp_surface_id,
          "components": [{
              "id": "response-text",
              "component": {
                  "Text": {
                      "text": {
                          "literalString": (
                              "Interact with the gallery to see responses. This view is"
                              " updated by the agent by relaying the raw action"
                              " commands it received from the client"
                          )
                      }
                  }
              },
          }],
      }
  })

  return json.dumps(messages, indent=2)


def get_v0_9_gallery_json() -> str:
  """Returns the JSON structure for the Component Gallery surfaces (v0.9)."""

  messages = []

  # Common Data Model for v0.9
  gallery_data_content = {
      "galleryData": {
          "textField": "Hello World",
          "checkbox": False,
          "checkboxChecked": True,
          "slider": 30,
          "date": "2025-10-26",
          "favorites": ["A"],
          "favoritesChips": [],
          "favoritesFilter": [],
      }
  }

  def add_message(msg):
    msg["version"] = "v0.9"
    messages.append(msg)

  def add_demo_surface(surface_id, component_def):
    root_id = "root"
    catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"

    add_message({"createSurface": {"surfaceId": surface_id, "catalogId": catalog_id}})

    # In v0.9, components include their id and component type directly
    full_component = {"id": root_id}
    full_component.update(component_def)

    add_message(
        {
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [full_component],
            }
        }
    )
    add_message(
        {
            "updateDataModel": {
                "surfaceId": surface_id,
                "value": gallery_data_content,
            }
        }
    )

  # 1. TextField
  add_demo_surface(
      "demo-text",
      {
          "component": "TextField",
          "label": "Enter some text",
          "value": {"path": "galleryData/textField"},
      },
  )

  # 1b. TextField (Regex)
  add_demo_surface(
      "demo-text-regex",
      {
          "component": "TextField",
          "label": "Enter exactly 5 digits",
          "value": {"path": "galleryData/textFieldRegex"},
          "validationRegexp": "^\\d{5}$",
      },
  )

  # 2. CheckBox
  add_demo_surface(
      "demo-checkbox",
      {
          "component": "CheckBox",
          "label": "Toggle me",
          "value": {"path": "galleryData/checkbox"},
      },
  )

  # 3. Slider
  add_demo_surface(
      "demo-slider",
      {
          "component": "Slider",
          "label": "Adjust slider",
          "value": {"path": "galleryData/slider"},
          "min": 0,
          "max": 100,
      },
  )

  # 4. DateTimeInput
  add_demo_surface(
      "demo-date",
      {
          "component": "DateTimeInput",
          "label": "Select Date",
          "value": {"path": "galleryData/date"},
          "enableDate": True,
      },
  )

  # 5. ChoicePicker
  add_demo_surface(
      "demo-multichoice",
      {
          "component": "ChoicePicker",
          "label": "Select favorites",
          "value": {"path": "galleryData/favorites"},
          "options": [
              {"label": "Apple", "value": "A"},
              {"label": "Banana", "value": "B"},
              {"label": "Cherry", "value": "C"},
          ],
      },
  )

  # 5b. ChoicePicker (Chips)
  add_demo_surface(
      "demo-multichoice-chips",
      {
          "component": "ChoicePicker",
          "label": "Select tags",
          "value": {"path": "galleryData/favoritesChips"},
          "variant": "multipleSelection",
          "displayStyle": "chips",
          "options": [
              {"label": "Work", "value": "work"},
              {"label": "Home", "value": "home"},
              {"label": "Urgent", "value": "urgent"},
              {"label": "Later", "value": "later"},
          ],
      },
  )

  # 5c. ChoicePicker (Filterable)
  add_demo_surface(
      "demo-multichoice-filter",
      {
          "component": "ChoicePicker",
          "label": "Select countries",
          "value": {"path": "galleryData/favoritesFilter"},
          "filterable": True,
          "options": [
              {"label": "United States", "value": "US"},
              {"label": "Canada", "value": "CA"},
              {"label": "United Kingdom", "value": "UK"},
              {"label": "Australia", "value": "AU"},
              {"label": "Germany", "value": "DE"},
              {"label": "France", "value": "FR"},
              {"label": "Japan", "value": "JP"},
          ],
      },
  )

  # 6. Image
  add_demo_surface(
      "demo-image",
      {
          "component": "Image",
          "url": "http://localhost:10005/assets/a2ui.png",
          "variant": "mediumFeature",
      },
  )

  # 7. Button
  button_surface_id = "demo-button"
  btn_root_id = "root"
  btn_text_id = "demo-button-text"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"

  add_message(
      {"createSurface": {"surfaceId": button_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": button_surface_id,
          "components": [
              {
                  "id": btn_text_id,
                  "component": "Text",
                  "text": "Trigger Action",
              },
              {
                  "id": btn_root_id,
                  "component": "Button",
                  "child": btn_text_id,
                  "variant": "primary",
                  "action": {
                      "event": {
                          "name": "custom_action",
                          "context": {
                              "info": "Custom Button Clicked",
                          },
                      },
                  },
              },
          ],
      }
  })

  # 8. Tabs
  tabs_surface_id = "demo-tabs"
  tabs_root_id = "root"
  tab1_id = "tab-1-content"
  tab2_id = "tab-2-content"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"

  add_message(
      {"createSurface": {"surfaceId": tabs_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": tabs_surface_id,
          "components": [
              {
                  "id": tab1_id,
                  "component": "Text",
                  "text": "First Tab Content",
              },
              {
                  "id": tab2_id,
                  "component": "Text",
                  "text": "Second Tab Content",
              },
              {
                  "id": tabs_root_id,
                  "component": "Tabs",
                  "tabs": [
                      {"title": "View One", "child": tab1_id},
                      {"title": "View Two", "child": tab2_id},
                  ],
              },
          ],
      }
  })

  # 9. Icon
  icon_surface_id = "demo-icon"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"
  add_message(
      {"createSurface": {"surfaceId": icon_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": icon_surface_id,
          "components": [
              {
                  "id": "root",
                  "component": "Row",
                  "children": ["icon-1", "icon-2", "icon-3"],
                  "justify": "spaceEvenly",
                  "align": "center",
              },
              {
                  "id": "icon-1",
                  "component": "Icon",
                  "name": "star",
              },
              {
                  "id": "icon-2",
                  "component": "Icon",
                  "name": "home",
              },
              {
                  "id": "icon-3",
                  "component": "Icon",
                  "name": "settings",
              },
          ],
      }
  })

  # 10. Divider
  div_surface_id = "demo-divider"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"
  add_message({"createSurface": {"surfaceId": div_surface_id, "catalogId": catalog_id}})
  add_message({
      "updateComponents": {
          "surfaceId": div_surface_id,
          "components": [
              {
                  "id": "root",
                  "component": "Column",
                  "children": ["div-text-1", "div-horiz", "div-text-2"],
                  "justify": "start",
                  "align": "stretch",
              },
              {
                  "id": "div-text-1",
                  "component": "Text",
                  "text": "Above Divider",
              },
              {"id": "div-horiz", "component": "Divider", "axis": "horizontal"},
              {
                  "id": "div-text-2",
                  "component": "Text",
                  "text": "Below Divider",
              },
          ],
      }
  })

  # 11. Card
  card_surface_id = "demo-card"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"
  add_message(
      {"createSurface": {"surfaceId": card_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": card_surface_id,
          "components": [
              {
                  "id": "root",
                  "component": "Card",
                  "child": "card-text",
              },
              {
                  "id": "card-text",
                  "component": "Text",
                  "text": "I am inside a Card",
              },
          ],
      }
  })

  # 12. Video
  add_demo_surface(
      "demo-video",
      {
          "component": "Video",
          "url": (
              "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          ),
      },
  )

  # 13. Modal
  modal_surface_id = "demo-modal"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"
  add_message(
      {"createSurface": {"surfaceId": modal_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": modal_surface_id,
          "components": [
              {
                  "id": "root",
                  "component": "Modal",
                  "trigger": "modal-btn",
                  "content": "modal-content",
              },
              {
                  "id": "modal-btn",
                  "component": "Button",
                  "child": "modal-btn-text",
                  "variant": "default",
                  "action": {"functionCall": {"call": "noop"}},
              },
              {
                  "id": "modal-btn-text",
                  "component": "Text",
                  "text": "Open Modal",
              },
              {
                  "id": "modal-content",
                  "component": "Text",
                  "text": "This is the modal content!",
              },
          ],
      }
  })

  # 14. List
  list_surface_id = "demo-list"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"
  add_message(
      {"createSurface": {"surfaceId": list_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": list_surface_id,
          "components": [
              {
                  "id": "root",
                  "component": "List",
                  "children": ["list-item-1", "list-item-2", "list-item-3"],
                  "direction": "vertical",
                  "align": "stretch",
              },
              {"id": "list-item-1", "component": "Text", "text": "Item 1"},
              {"id": "list-item-2", "component": "Text", "text": "Item 2"},
              {"id": "list-item-3", "component": "Text", "text": "Item 3"},
          ],
      }
  })

  # 15. AudioPlayer
  add_demo_surface(
      "demo-audio",
      {
          "component": "AudioPlayer",
          "url": "http://localhost:10005/assets/audio.mp3",
          "description": "Local Audio Sample",
      },
  )

  # Response Surface
  resp_surface_id = "response-surface"
  catalog_id = "https://a2ui.org/specification/v0_9/basic_catalog.json"
  add_message(
      {"createSurface": {"surfaceId": resp_surface_id, "catalogId": catalog_id}}
  )
  add_message({
      "updateComponents": {
          "surfaceId": resp_surface_id,
          "components": [{
              "id": "root",
              "component": "Text",
              "text": (
                  "Interact with the gallery to see responses. This view is"
                  " updated by the agent by relaying the raw action"
                  " commands it received from the client"
              ),
          }],
      }
  })

  return json.dumps(messages, indent=2)
