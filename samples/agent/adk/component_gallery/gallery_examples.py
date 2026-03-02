"""Defines the Component Gallery 'Kitchen Sink' example."""

import json


def get_gallery_json() -> str:
  """Returns the JSON structure for the Component Gallery surfaces."""

  messages = []

  # Common Data Model
  # We use a single global data model for simplicity across all demo surfaces.
  # Common Data Model Content
  # We define the content here and inject it into EACH surface so they all share the same initial state.
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
          # Chart demo data
          {
              "key": "pieChartData",
              "valueMap": [
                  {
                      "key": "0",
                      "valueMap": [
                          {"key": "label", "valueString": "Apparel"},
                          {"key": "value", "valueNumber": 41},
                          {
                              "key": "drillDown",
                              "valueMap": [
                                  {
                                      "key": "0",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Tops"},
                                          {"key": "value", "valueNumber": 31},
                                      ],
                                  },
                                  {
                                      "key": "1",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Bottoms"},
                                          {"key": "value", "valueNumber": 38},
                                      ],
                                  },
                                  {
                                      "key": "2",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Outerwear"},
                                          {"key": "value", "valueNumber": 20},
                                      ],
                                  },
                                  {
                                      "key": "3",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Footwear"},
                                          {"key": "value", "valueNumber": 11},
                                      ],
                                  },
                              ],
                          },
                      ],
                  },
                  {
                      "key": "1",
                      "valueMap": [
                          {"key": "label", "valueString": "Electronics"},
                          {"key": "value", "valueNumber": 28},
                          {
                              "key": "drillDown",
                              "valueMap": [
                                  {
                                      "key": "0",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Phones"},
                                          {"key": "value", "valueNumber": 25},
                                      ],
                                  },
                                  {
                                      "key": "1",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Laptops"},
                                          {"key": "value", "valueNumber": 27},
                                      ],
                                  },
                                  {
                                      "key": "2",
                                      "valueMap": [
                                          {"key": "label", "valueString": "TVs"},
                                          {"key": "value", "valueNumber": 21},
                                      ],
                                  },
                              ],
                          },
                      ],
                  },
                  {
                      "key": "2",
                      "valueMap": [
                          {"key": "label", "valueString": "Home Goods"},
                          {"key": "value", "valueNumber": 15},
                          {
                              "key": "drillDown",
                              "valueMap": [
                                  {
                                      "key": "0",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Furniture"},
                                          {"key": "value", "valueNumber": 8},
                                      ],
                                  },
                                  {
                                      "key": "1",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Kitchen"},
                                          {"key": "value", "valueNumber": 16},
                                      ],
                                  },
                                  {
                                      "key": "2",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Decor"},
                                          {"key": "value", "valueNumber": 3},
                                      ],
                                  },
                              ],
                          },
                      ],
                  },
                  {
                      "key": "3",
                      "valueMap": [
                          {"key": "label", "valueString": "Health"},
                          {"key": "value", "valueNumber": 10},
                      ],
                  },
                  {
                      "key": "4",
                      "valueMap": [
                          {"key": "label", "valueString": "Other"},
                          {"key": "value", "valueNumber": 6},
                      ],
                  },
              ],
          },
          {
              "key": "barChartData",
              "valueMap": [
                  {
                      "key": "0",
                      "valueMap": [
                          {"key": "label", "valueString": "Jan"},
                          {"key": "value", "valueNumber": 12},
                      ],
                  },
                  {
                      "key": "1",
                      "valueMap": [
                          {"key": "label", "valueString": "Feb"},
                          {"key": "value", "valueNumber": 19},
                      ],
                  },
                  {
                      "key": "2",
                      "valueMap": [
                          {"key": "label", "valueString": "Mar"},
                          {"key": "value", "valueNumber": 15},
                      ],
                  },
                  {
                      "key": "3",
                      "valueMap": [
                          {"key": "label", "valueString": "Apr"},
                          {"key": "value", "valueNumber": 22},
                      ],
                  },
                  {
                      "key": "4",
                      "valueMap": [
                          {"key": "label", "valueString": "May"},
                          {"key": "value", "valueNumber": 30},
                      ],
                  },
                  {
                      "key": "5",
                      "valueMap": [
                          {"key": "label", "valueString": "Jun"},
                          {"key": "value", "valueNumber": 28},
                      ],
                  },
              ],
          },
          # OrgChart demo data
          {
              "key": "orgChartChain",
              "valueMap": [
                  {
                      "key": "0",
                      "valueMap": [
                          {"key": "title", "valueString": "CEO"},
                          {"key": "name", "valueString": "Alice Johnson"},
                      ],
                  },
                  {
                      "key": "1",
                      "valueMap": [
                          {"key": "title", "valueString": "SVP Engineering"},
                          {"key": "name", "valueString": "Bob Smith"},
                      ],
                  },
                  {
                      "key": "2",
                      "valueMap": [
                          {"key": "title", "valueString": "VP Product"},
                          {"key": "name", "valueString": "Charlie Brown"},
                      ],
                  },
                  {
                      "key": "3",
                      "valueMap": [
                          {"key": "title", "valueString": "Director"},
                          {"key": "name", "valueString": "Diana Prince"},
                      ],
                  },
                  {
                      "key": "4",
                      "valueMap": [
                          {"key": "title", "valueString": "Software Engineer"},
                          {"key": "name", "valueString": "Evan Wright"},
                      ],
                  },
              ],
          },
          {
              "key": "doughnutChartData",
              "valueMap": [
                  {
                      "key": "0",
                      "valueMap": [
                          {"key": "label", "valueString": "Engineering"},
                          {"key": "value", "valueNumber": 45},
                          {
                              "key": "drillDown",
                              "valueMap": [
                                  {
                                      "key": "0",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Frontend"},
                                          {"key": "value", "valueNumber": 18},
                                      ],
                                  },
                                  {
                                      "key": "1",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Backend"},
                                          {"key": "value", "valueNumber": 15},
                                      ],
                                  },
                                  {
                                      "key": "2",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Infra"},
                                          {"key": "value", "valueNumber": 12},
                                      ],
                                  },
                              ],
                          },
                      ],
                  },
                  {
                      "key": "1",
                      "valueMap": [
                          {"key": "label", "valueString": "Marketing"},
                          {"key": "value", "valueNumber": 20},
                          {
                              "key": "drillDown",
                              "valueMap": [
                                  {
                                      "key": "0",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Digital"},
                                          {"key": "value", "valueNumber": 12},
                                      ],
                                  },
                                  {
                                      "key": "1",
                                      "valueMap": [
                                          {"key": "label", "valueString": "Brand"},
                                          {"key": "value", "valueNumber": 8},
                                      ],
                                  },
                              ],
                          },
                      ],
                  },
                  {
                      "key": "2",
                      "valueMap": [
                          {"key": "label", "valueString": "Operations"},
                          {"key": "value", "valueNumber": 20},
                      ],
                  },
                  {
                      "key": "3",
                      "valueMap": [
                          {"key": "label", "valueString": "Sales"},
                          {"key": "value", "valueNumber": 15},
                      ],
                  },
              ],
          },
      ],
  }

  # Helper to create a surface for a single component
  def add_demo_surface(surface_id, component_def):
    root_id = f"{surface_id}-root"

    components = []
    components.append({"id": root_id, "component": component_def})

    messages.append({"beginRendering": {"surfaceId": surface_id, "root": root_id}})
    messages.append(
        {"surfaceUpdate": {"surfaceId": surface_id, "components": components}}
    )

    # Inject data model for this surface
    messages.append({
        "dataModelUpdate": {"surfaceId": surface_id, "contents": [gallery_data_content]}
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
      {"beginRendering": {"surfaceId": button_surface_id, "root": btn_root_id}}
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
      {"beginRendering": {"surfaceId": tabs_surface_id, "root": tabs_root_id}}
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
      {"beginRendering": {"surfaceId": icon_surface_id, "root": "icon-root"}}
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
  messages.append({"beginRendering": {"surfaceId": div_surface_id, "root": "div-root"}})
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
      {"beginRendering": {"surfaceId": card_surface_id, "root": "card-root"}}
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
      {"beginRendering": {"surfaceId": modal_surface_id, "root": "modal-root"}}
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
      {"beginRendering": {"surfaceId": list_surface_id, "root": "list-root"}}
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

  # 16. Chart (Pie) — with drill-down data
  add_demo_surface(
      "demo-chart-pie",
      {
          "Chart": {
              "chartType": "pie",
              "chartTitle": {"literalString": "Sales by Category"},
              "chartData": {"path": "galleryData/pieChartData"},
          }
      },
  )

  # 17. Chart (Bar) — flat data, no drill-down
  add_demo_surface(
      "demo-chart-bar",
      {
          "Chart": {
              "chartType": "bar",
              "chartTitle": {"literalString": "Monthly Revenue"},
              "chartData": {"path": "galleryData/barChartData"},
          }
      },
  )

  # 18. Chart (Doughnut) — with drill-down data
  add_demo_surface(
      "demo-chart-doughnut",
      {
          "Chart": {
              "chartType": "doughnut",
              "chartTitle": {"literalString": "Budget Allocation"},
              "chartData": {"path": "galleryData/doughnutChartData"},
          }
      },
  )

  # 19. OrgChart — custom component showing organizational hierarchy
  add_demo_surface(
      "demo-org-chart",
      {
          "OrgChart": {
              "chain": {"path": "galleryData/orgChartChain"},
              "action": {
                  "name": "org_chart_click",
                  "context": [],
              },
          }
      },
  )

  # Response Surface
  messages.append(
      {"beginRendering": {"surfaceId": "response-surface", "root": "response-text"}}
  )
  messages.append({
      "surfaceUpdate": {
          "surfaceId": "response-surface",
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
