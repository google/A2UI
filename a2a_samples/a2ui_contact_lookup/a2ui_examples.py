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

# a2ui_examples.py

CONTACT_UI_EXAMPLES = """
---BEGIN CONTACT_LIST_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "contact-list", "root": "root-column", "styles": { "primaryColor": "#007BFF", "font": "Roboto" } } },
  { "surfaceUpdate": {
    "surfaceId": "contact-list",
    "components": [
      { "id": "root-column", "component": { "Column": { "children": { "explicitList": ["title-heading", "item-list"] } } } },
      { "id": "title-heading", "component": { "Heading": { "level": "1", "text": { "literalString": "Found Contacts" } } } },
      { "id": "item-list", "component": { "List": { "direction": "vertical", "children": { "template": { "componentId": "item-card-template", "dataBinding": "/contacts" } } } } },
      { "id": "item-card-template", "component": { "Card": { "child": "card-layout" } } },
      { "id": "card-layout", "component": { "Row": { "children": { "explicitList": ["template-image", "card-details", "view-button"] }, "alignment": "center" } } },
      { "id": "template-image", "component": { "Image": { "url": { "path": "imageUrl" }, "fit": "cover" } } },
      { "id": "card-details", "component": { "Column": { "children": { "explicitList": ["template-name", "template-title"] } } } },
      { "id": "template-name", "component": { "Heading": { "level": "3", "text": { "path": "name" } } } },
      { "id": "template-title", "component": { "Text": { "text": { "path": "title" } } } },
      { "id": "view-button-text", "component": { "Text": { "text": { "literalString": "View" } } } },
      { "id": "view-button", "component": { "Button": { "child": "view-button-text", "action": { "name": "view_profile", "context": [ { "key": "contactName", "value": { "path": "name" } }, { "key": "department", "value": { "path": "department" } } ] } } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "contact-list",
    "path": "/",
    "contents": [
      { "key": "contacts", "valueList": [] }
    ]
  } }
]
---END CONTACT_LIST_EXAMPLE---

---BEGIN CONTACT_CARD_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "contact-card", "root": "root-card", "styles": { "primaryColor": "#007BFF", "font": "Roboto" } } },
  { "surfaceUpdate": {
    "surfaceId": "contact-card",
    "components": [
      { "id": "root-card", "component": { "Card": { "child": "card-layout" } } },
      { "id": "card-layout", "component": { "Column": { "children": { "explicitList": ["header-row", "divider-1", "details-col", "divider-2", "button-row"] } } } },
      { "id": "header-row", "component": { "Row": { "children": { "explicitList": ["profile-pic", "name-title-col"] }, "alignment": "center" } } },
      { "id": "profile-pic", "component": { "Image": { "url": { "path": "imageUrl" }, "fit": "cover", "width": "80px" } } },
      { "id": "name-title-col", "component": { "Column": { "children": { "explicitList": ["contact-name", "contact-title", "contact-team"] } } } },
      { "id": "contact-name", "component": { "Heading": { "level": "2", "text": { "path": "name" } } } },
      { "id": "contact-title", "component": { "Text": { "text": { "path": "title" } } } },
      { "id": "contact-team", "component": { "Text": { "text": { "path": "department" } } } },
      { "id": "divider-1", "component": { "Divider": {} } },
      { "id": "details-col", "component": { "Column": { "children": { "explicitList": ["location-row", "email-row", "mobile-row", "calendar-row"] } } } },
      { "id": "location-row", "component": { "Row": { "children": { "explicitList": ["location-label", "location-value"] } } } },
      { "id": "location-label", "component": { "Text": { "text": { "literalString": "Location" } } } },
      { "id": "location-value", "component": { "Text": { "text": { "path": "location" } } } },
      { "id": "email-row", "component": { "Row": { "children": { "explicitList": ["email-label", "email-value"] } } } },
      { "id": "email-label", "component": { "Text": { "text": { "literalString": "Email" } } } },
      { "id": "email-value", "component": { "Text": { "text": { "path": "email" } } } },
      { "id": "mobile-row", "component": { "Row": { "children": { "explicitList": ["mobile-label", "mobile-value"] } } } },
      { "id": "mobile-label", "component": { "Text": { "text": { "literalString": "Mobile" } } } },
      { "id": "mobile-value", "component": { "Text": { "text": { "path": "mobile" } } } },
      { "id": "calendar-row", "component": { "Row": { "children": { "explicitList": ["calendar-label", "calendar-value"] } } } },
      { "id": "calendar-label", "component": { "Text": { "text": { "literalString": "Calendar" } } } },
      { "id": "calendar-value", "component": { "Text": { "text": { "path": "calendar" } } } },
      { "id": "divider-2", "component": { "Divider": {} } },
      { "id": "button-row", "component": { "Row": { "children": { "explicitList": ["message-button", "email-button", "profile-button"] }, "distribution": "spaceEvenly" } } },
      { "id": "message-button-text", "component": { "Text": { "text": { "literalString": "Message" } } } },
      { "id": "message-button", "component": { "Button": { "child": "message-button-text", "action": { "name": "send_message", "context": [ { "key": "contactName", "value": { "path": "name" } } ] } } } },
      { "id": "email-button-text", "component": { "Text": { "text": { "literalString": "Email" } } } },
      { "id": "email-button", "component": { "Button": { "child": "email-button-text", "action": { "name": "send_email", "context": [ { "key": "contactName", "value": { "path": "name" } }, { "key": "email", "value": { "path": "email" } } ] } } } },
      { "id": "profile-button-text", "component": { "Text": { "text": { "literalString": "Profile" } } } },
      { "id": "profile-button", "component": { "Button": { "child": "profile-button-text", "action": { "name": "view_full_profile", "context": [ { "key": "contactName", "value": { "path": "name" } } ] } } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "contact-card",
    "path": "/",
    "contents": [
      { "key": "name", "valueString": "" },
      { "key": "title", "valueString": "" },
      { "key": "team", "valueString": "" },
      { "key": "location", "valueString": "" },
      { "key": "email", "valueString": "" },
      { "key": "mobile", "valueString": "" },
      { "key": "calendar", "valueString": "" },
      { "key": "imageUrl", "valueString": "" }
    ]
  } }
]
---END CONTACT_CARD_EXAMPLE---

---BEGIN ACTION_CONFIRMATION_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "action-modal", "root": "modal-wrapper", "styles": { "primaryColor": "#007BFF", "font": "Roboto" } } },
  { "surfaceUpdate": {
    "surfaceId": "action-modal",
    "components": [
      { "id": "modal-wrapper", "component": { "Modal": { "entryPointChild": "hidden-entry-point", "contentChild": "modal-content-column" } } },
      { "id": "hidden-entry-point", "component": { "Text": { "text": { "literalString": "" } } } },
      { "id": "modal-content-column", "component": { "Column": { "children": { "explicitList": ["modal-title", "modal-message", "dismiss-button"] }, "alignment": "center" } } },
      { "id": "modal-title", "component": { "Heading": { "level": "2", "text": { "path": "actionTitle" } } } },
      { "id": "modal-message", "component": { "Text": { "text": { "path": "actionMessage" } } } },
      { "id": "dismiss-button-text", "component": { "Text": { "text": { "literalString": "Dismiss" } } } },
      { "id": "dismiss-button", "component": { "Button": { "child": "dismiss-button-text", "action": { "name": "dismiss_modal" } } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "action-modal",
    "path": "/",
    "contents": [
      { "key": "actionTitle", "valueString": "Action Confirmation" },
      { "key": "actionMessage", "valueString": "Your action has been processed." }
    ]
  } }
]
---END ACTION_CONFIRMATION_EXAMPLE---
"""
