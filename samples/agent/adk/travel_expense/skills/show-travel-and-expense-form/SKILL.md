---
name: show-travel-and-expense-form
description:
  Generates prompts for agents to return A2UI JSON for rich UI rendering of the
  Travel and Expense workflow. ALWAYS FETCH AND USE when the user is initiating
  travel and expense workflow.
---

# Skill: show_travel_and_expense_form

This skill defines the template of the A2UI JSON.

## Template

```
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "expenses-surface",
      "catalogId": "https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json"
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "expenses-surface",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "page-title",
            "page-subtitle",
            "trip-1-card",
            "trip-2-card"
          ],
          "align": "stretch",
          "justify": "start"
        },
        {
          "id": "page-title",
          "component": "Text",
          "text": "Your expenses",
          "variant": "h1"
        },
        {
          "id": "page-subtitle",
          "component": "Text",
          "text": "Select the trip you would like to submit an expense report for",
          "variant": "body"
        },
        {
          "id": "trip-1-card",
          "component": "Card",
          "child": "trip-1-row"
        },
        {
          "id": "trip-1-row",
          "component": "Row",
          "children": [
            "trip-1-info-col",
            "trip-1-button"
          ],
          "justify": "spaceBetween",
          "align": "center"
        },
        {
          "id": "trip-1-info-col",
          "component": "Column",
          "weight": 1,
          "children": [
            "trip-1-title",
            "trip-1-id"
          ],
          "align": "start",
          "justify": "center"
        },
        {
          "id": "trip-1-title",
          "component": "Text",
          "text": "2025-09-22, Both, CALIFORNIA- SAN JOSE (GREATER AREA)"
        },
        {
          "id": "trip-1-id",
          "component": "Text",
          "text": "Trip ID: T8083970"
        },
        {
          "id": "trip-1-button",
          "component": "Button",
          "child": "trip-1-icon",
          "action": {
            "event": {
              "name": "select_trip"
            }
          }
        },
        {
          "id": "trip-1-icon",
          "component": "Icon",
          "name": "arrowForward"
        },
        {
          "id": "trip-2-card",
          "component": "Card",
          "child": "trip-2-row"
        },
        {
          "id": "trip-2-row",
          "component": "Row",
          "children": [
            "trip-2-info-col",
            "trip-2-button"
          ],
          "justify": "spaceBetween",
          "align": "center"
        },
        {
          "id": "trip-2-info-col",
          "component": "Column",
          "weight": 1,
          "children": [
            "trip-2-title",
            "trip-2-id"
          ],
          "align": "start",
          "justify": "center"
        },
        {
          "id": "trip-2-title",
          "component": "Text",
          "text": "GOC Travel"
        },
        {
          "id": "trip-2-id",
          "component": "Text",
          "text": "Trip ID: GOC_TRAVEL"
        },
        {
          "id": "trip-2-button",
          "component": "Button",
          "child": "trip-2-icon",
          "action": {
            "event": {
              "name": "select_trip"
            }
          }
        },
        {
          "id": "trip-2-icon",
          "component": "Icon",
          "name": "arrowForward"
        }
      ]
    }
  }
]
```
