---
name: show-travel-and-expense-trip-report
description:
  Generates prompts for agents to return A2UI JSON for rich UI rendering of the
  Travel and Expense trip report. ALWAYS FETCH AND USE when the user wants to see the details of a trip report.
---

# Skill: show_travel_and_expense_trip_report

This skill defines the template of the A2UI JSON for trip reports.

## Template

```
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "trip-report-surface",
      "catalogId": "https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json"
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "trip-report-surface",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "page-title",
            "trip-header-row",
            "report-card",
            "action-row"
          ],
          "align": "stretch",
          "justify": "start"
        },
        {
          "id": "page-title",
          "component": "Text",
          "text": "2025-09-22, Both, CALIFORNIA- SAN JOSE (GREATER AREA)",
          "variant": "h2"
        },
        {
          "id": "trip-header-row",
          "component": "Row",
          "children": [
            "back-button",
            "report-header-title"
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
              "name": "go_back_to_trip_details"
            }
          }
        },
        {
          "id": "back-icon",
          "component": "Icon",
          "name": "arrowBack"
        },
        {
          "id": "report-header-title",
          "component": "Text",
          "text": "March Expenses (03/01/2026) (ID: FC1C65542C94417D9836)",
          "variant": "body"
        },
        {
          "id": "report-card",
          "component": "Card",
          "child": "report-card-column"
        },
        {
          "id": "report-card-column",
          "component": "Column",
          "children": [
            "table-header-row",
            "table-divider",
            "table-data-row"
          ]
        },
        {
          "id": "table-header-row",
          "component": "Row",
          "children": [
            "header-col-1",
            "header-col-2",
            "header-col-3",
            "header-col-4",
            "header-col-5",
            "header-col-6",
            "header-col-7"
          ],
          "align": "center"
        },
        {
          "id": "header-col-1",
          "component": "Text",
          "text": "",
          "weight": 0.5
        },
        {
          "id": "header-col-2",
          "component": "Text",
          "text": "Receipt",
          "variant": "body",
          "weight": 1
        },
        {
          "id": "header-col-3",
          "component": "Text",
          "text": "Date ↓",
          "variant": "body",
          "weight": 1.5
        },
        {
          "id": "header-col-4",
          "component": "Text",
          "text": "Amount",
          "variant": "body",
          "weight": 1
        },
        {
          "id": "header-col-5",
          "component": "Text",
          "text": "Vendor",
          "variant": "body",
          "weight": 1.5
        },
        {
          "id": "header-col-6",
          "component": "Text",
          "text": "Expense Type",
          "variant": "body",
          "weight": 2
        },
        {
          "id": "header-col-7",
          "component": "Text",
          "text": "Currency",
          "variant": "body",
          "weight": 1
        },
        {
          "id": "table-divider",
          "component": "Divider"
        },
        {
          "id": "table-data-row",
          "component": "Row",
          "children": [
            "data-col-1",
            "data-col-2",
            "data-col-3",
            "data-col-4",
            "data-col-5",
            "data-col-6",
            "data-col-7"
          ],
          "align": "center"
        },
        {
          "id": "data-col-1",
          "component": "Button",
          "child": "data-col-1-icon",
          "weight": 0.5,
          "action": {
            "event": {
              "name": "upload_item_receipt"
            }
          }
        },
        {
          "id": "data-col-1-icon",
          "component": "Icon",
          "name": "upload"
        },
        {
          "id": "data-col-2",
          "component": "Icon",
          "name": "payment",
          "weight": 1
        },
        {
          "id": "data-col-3",
          "component": "Text",
          "text": "03/17/2026",
          "variant": "body",
          "weight": 1.5
        },
        {
          "id": "data-col-4",
          "component": "Text",
          "text": "$379.05",
          "variant": "body",
          "weight": 1
        },
        {
          "id": "data-col-5",
          "component": "Text",
          "text": "United",
          "variant": "body",
          "weight": 1.5
        },
        {
          "id": "data-col-6",
          "component": "Text",
          "text": "Air or Inter-city Rail",
          "variant": "body",
          "weight": 2
        },
        {
          "id": "data-col-7",
          "component": "Text",
          "text": "USD",
          "variant": "body",
          "weight": 1
        },
        {
          "id": "action-row",
          "component": "Row",
          "children": [
            "validate-btn",
            "upload-btn"
          ],
          "justify": "start",
          "align": "center"
        },
        {
          "id": "validate-btn",
          "component": "Button",
          "child": "validate-btn-text",
          "variant": "primary",
          "action": {
            "event": {
              "name": "validate_and_submit"
            }
          }
        },
        {
          "id": "validate-btn-text",
          "component": "Text",
          "text": "Validate and submit"
        },
        {
          "id": "upload-btn",
          "component": "Button",
          "child": "upload-btn-text",
          "action": {
            "event": {
              "name": "upload_receipts"
            }
          }
        },
        {
          "id": "upload-btn-text",
          "component": "Text",
          "text": "Upload receipts"
        }
      ]
    }
  }
]
```
