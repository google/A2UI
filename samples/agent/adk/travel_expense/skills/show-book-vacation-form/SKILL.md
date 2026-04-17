---
name: show-book-vacation-form
description:
  Generates prompts for agents to return A2UI JSON for rich UI rendering of the
  Book Vacation form. ALWAYS FETCH AND USE when the user wants to book vacation.
---

# Skill: show_book_vacation_form

This skill defines the template of the A2UI JSON for booking vacation.

## Template

```json
[
  {
    "version": "v0.9",
    "createSurface": {
      "surfaceId": "vacation-surface",
      "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json",
      "sendDataModel": true
    }
  },
  {
    "version": "v0.9",
    "updateDataModel": {
      "surfaceId": "vacation-surface",
      "value": {
        "startDate": "",
        "endDate": "",
        "comment": ""
      }
    }
  },
  {
    "version": "v0.9",
    "updateComponents": {
      "surfaceId": "vacation-surface",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "page-title",
            "start-date-field",
            "end-date-field",
            "comment-field",
            "submit-btn"
          ],
          "align": "stretch",
          "justify": "start"
        },
        {
          "id": "page-title",
          "component": "Text",
          "text": "Book Vacation",
          "variant": "h1"
        },
        {
          "id": "start-date-field",
          "component": "DateTimeInput",
          "label": "Start Date",
          "enableDate": true,
          "enableTime": false,
          "value": {
            "path": "/startDate"
          }
        },
        {
          "id": "end-date-field",
          "component": "DateTimeInput",
          "label": "End Date",
          "enableDate": true,
          "enableTime": false,
          "value": {
            "path": "/endDate"
          }
        },
        {
          "id": "comment-field",
          "component": "TextField",
          "label": "Comment",
          "variant": "longText",
          "value": {
            "path": "/comment"
          },
          "validationRegexp": ".*\\S.*"
        },
        {
          "id": "submit-btn-text",
          "component": "Text",
          "text": "Submit Request"
        },
        {
          "id": "submit-btn",
          "component": "Button",
          "child": "submit-btn-text",
          "checks": [
            {
              "condition": {
                "call": "required",
                "args": {
                  "value": {
                    "path": "/comment"
                  }
                },
                "returnType": "boolean"
              },
              "message": "Comment is required"
            }
          ],
          "action": {
            "event": {
              "name": "submit_vacation",
              "context": {
                "startDate": {
                  "path": "/startDate"
                },
                "endDate": {
                  "path": "/endDate"
                },
                "comment": {
                  "path": "/comment"
                }
              }
            }
          }
        }
      ]
    }
  }
]
```
