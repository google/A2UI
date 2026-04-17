---
name: show-travel-and-expense-trip-details
description:
  Generates prompts for agents to return A2UI JSON for rich UI rendering of the
  Travel and Expense trip details. ALWAYS FETCH AND USE when the user wants to see the details of a trip and select a report.
---

# Skill: show_travel_and_expense_trip_details

This skill defines the template of the A2UI JSON for trip details.

## Template

```
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "trip-details-surface",
      "catalogId": "https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json"
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "trip-details-surface",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "page-title",
            "page-subtitle",
            "trip-header-row",
            "report-1-card",
            "report-2-card"
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
          "text": "Select the report you would like to submit an expense against",
          "variant": "body"
        },
        {
          "id": "trip-header-row",
          "component": "Row",
          "children": [
            "back-button",
            "trip-header-title"
          ],
          "justify": "start",
          "align": "center"
        },
        {
          "id": "back-button",
          "component": "Button",
          "child": "back-icon",
          "action": {
            "event": {
              "name": "go_back"
            }
          }
        },
        {
          "id": "back-icon",
          "component": "Icon",
          "name": "arrowBack"
        },
        {
          "id": "trip-header-title",
          "component": "Text",
          "text": "2025-09-22, Both, CALIFORNIA- SAN JOSE (GREATER AREA)",
          "variant": "h3"
        },
        {
          "id": "report-1-card",
          "component": "Card",
          "child": "report-1-row"
        },
        {
          "id": "report-1-row",
          "component": "Row",
          "children": [
            "report-1-info-col",
            "report-1-select-button"
          ],
          "justify": "spaceBetween",
          "align": "center"
        },
        {
          "id": "report-1-info-col",
          "component": "Column",
          "weight": 1,
          "children": [
            "report-1-title",
            "report-1-id"
          ],
          "align": "start",
          "justify": "center"
        },
        {
          "id": "report-1-title",
          "component": "Text",
          "text": "March Expenses (03/01/2026)"
        },
        {
          "id": "report-1-id",
          "component": "Text",
          "text": "Report ID: FC1C65542C94417D9836"
        },
        {
          "id": "report-1-select-button",
          "component": "Button",
          "child": "report-1-select-button-text",
          "variant": "primary",
          "action": {
            "event": {
              "name": "select_report"
            }
          }
        },
        {
          "id": "report-1-select-button-text",
          "component": "Text",
          "text": "Select"
        },
        {
          "id": "report-2-card",
          "component": "Card",
          "child": "report-2-row"
        },
        {
          "id": "report-2-row",
          "component": "Row",
          "children": [
            "report-2-info-col",
            "report-2-select-button"
          ],
          "justify": "spaceBetween",
          "align": "center"
        },
        {
          "id": "report-2-info-col",
          "component": "Column",
          "weight": 1,
          "children": [
            "report-2-title",
            "report-2-id"
          ],
          "align": "start",
          "justify": "center"
        },
        {
          "id": "report-2-title",
          "component": "Text",
          "text": "September Expenses (09/01/2025)"
        },
        {
          "id": "report-2-id",
          "component": "Text",
          "text": "Report ID: 7FAC58CF6BB14733932C"
        },
        {
          "id": "report-2-select-button",
          "component": "Button",
          "child": "report-2-select-button-text",
          "variant": "primary",
          "action": {
            "event": {
              "name": "select_report"
            }
          }
        },
        {
          "id": "report-2-select-button-text",
          "component": "Text",
          "text": "Select"
        }
      ]
    }
  }
]
```
