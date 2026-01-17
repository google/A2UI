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

# a2ui_examples.py - UI templates for the Digital Botanist agent

BOTANIST_UI_EXAMPLES = """
---BEGIN PLANT_LIST_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "plant-list", "root": "root-column", "styles": { "primaryColor": "#2E7D32", "font": "Roboto" } } },
  { "surfaceUpdate": {
    "surfaceId": "plant-list",
    "components": [
      { "id": "root-column", "component": { "Column": { "children": { "explicitList": ["title-heading", "subtitle-text", "item-list"] } } } },
      { "id": "title-heading", "component": { "Text": { "usageHint": "h1", "text": { "literalString": "Plants Found" } } } },
      { "id": "subtitle-text", "component": { "Text": { "text": { "literalString": "Tap a plant to learn more" } } } },
      { "id": "item-list", "component": { "List": { "direction": "vertical", "children": { "template": { "componentId": "item-card-template", "dataBinding": "/plants" } } } } },
      { "id": "item-card-template", "component": { "Card": { "child": "card-layout" } } },
      { "id": "card-layout", "component": { "Row": { "children": { "explicitList": ["template-image", "card-details", "view-button"] }, "alignment": "center" } } },
      { "id": "template-image", "component": { "Image": { "url": { "path": "image" }, "fit": "cover" } } },
      { "id": "card-details", "component": { "Column": { "children": { "explicitList": ["template-common-name", "template-scientific-name", "template-category"] } } } },
      { "id": "template-common-name", "component": { "Text": { "usageHint": "h3", "text": { "path": "common_name" } } } },
      { "id": "template-scientific-name", "component": { "Text": { "text": { "path": "scientific_name" }, "style": { "fontStyle": "italic" } } } },
      { "id": "template-category", "component": { "Text": { "text": { "path": "category" } } } },
      { "id": "view-button-text", "component": { "Text": { "text": { "literalString": "View" } } } },
      { "id": "view-button", "component": { "Button": { "child": "view-button-text", "primary": true, "action": { "name": "view_plant", "context": [ { "key": "plantId", "value": { "path": "id" } }, { "key": "plantName", "value": { "path": "common_name" } } ] } } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "plant-list",
    "path": "/",
    "contents": [
      { "key": "plants", "valueMap": [] }
    ]
  } }
]
---END PLANT_LIST_EXAMPLE---

---BEGIN PLANT_CARD_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "plant-card", "root": "main_card", "styles": { "primaryColor": "#2E7D32" } } },
  { "surfaceUpdate": { "surfaceId": "plant-card",
    "components": [
      { "id": "plant_image", "component": { "Image": { "url": { "path": "image" }, "usageHint": "hero", "fit": "cover" } } },
      { "id": "common_name_heading", "weight": 1, "component": { "Text": { "text": { "path": "common_name" }, "usageHint": "h2" } } },
      { "id": "scientific_name_text", "component": { "Text": { "text": { "path": "scientific_name" }, "style": { "fontStyle": "italic" } } } },
      { "id": "name_column", "component": { "Column": { "children": { "explicitList": ["common_name_heading", "scientific_name_text"] }, "alignment": "center" } } },
      { "id": "category_icon", "component": { "Icon": { "name": { "literalString": "eco" } } } },
      { "id": "category_label", "component": { "Text": { "usageHint": "h5", "text": { "path": "category" } } } },
      { "id": "category_sublabel", "component": { "Text": { "text": { "literalString": "Category" } } } },
      { "id": "category_text_column", "component": { "Column": { "children": { "explicitList": ["category_label", "category_sublabel"] }, "distribution": "start", "alignment": "start" } } },
      { "id": "info_row_1", "component": { "Row": { "children": { "explicitList": ["category_icon", "category_text_column"] }, "distribution": "start", "alignment": "start" } } },
      { "id": "page_icon", "component": { "Icon": { "name": { "literalString": "menu_book" } } } },
      { "id": "page_label", "component": { "Text": { "usageHint": "h5", "text": { "path": "page" } } } },
      { "id": "page_sublabel", "component": { "Text": { "text": { "literalString": "Catalog Page" } } } },
      { "id": "page_text_column", "component": { "Column": { "children": { "explicitList": ["page_label", "page_sublabel"] }, "distribution": "start", "alignment": "start" } } },
      { "id": "info_row_2", "component": { "Row": { "children": { "explicitList": ["page_icon", "page_text_column"] }, "distribution": "start", "alignment": "start" } } },
      { "id": "id_icon", "component": { "Icon": { "name": { "literalString": "tag" } } } },
      { "id": "id_label", "component": { "Text": { "usageHint": "h5", "text": { "path": "id" } } } },
      { "id": "id_sublabel", "component": { "Text": { "text": { "literalString": "Plant ID" } } } },
      { "id": "id_text_column", "component": { "Column": { "children": { "explicitList": ["id_label", "id_sublabel"] }, "distribution": "start", "alignment": "start" } } },
      { "id": "info_row_3", "component": { "Row": { "children": { "explicitList": ["id_icon", "id_text_column"] }, "distribution": "start", "alignment": "start" } } },
      { "id": "div", "component": { "Divider": { } } },
      { "id": "info_rows_column", "weight": 1, "component": { "Column": { "children": { "explicitList": ["info_row_1", "info_row_2", "info_row_3"] }, "alignment": "stretch" } } },
      { "id": "add_cart_button_text", "component": { "Text": { "text": { "literalString": "Add to Cart" } } } },
      { "id": "add_cart_button", "component": { "Button": { "child": "add_cart_button_text", "primary": true, "action": { "name": "add_to_cart", "context": [ { "key": "plantId", "value": { "path": "id" } } ] } } } },
      { "id": "browse_category_button_text", "component": { "Text": { "text": { "literalString": "More in Category" } } } },
      { "id": "browse_category_button", "component": { "Button": { "child": "browse_category_button_text", "primary": false, "action": { "name": "browse_category", "context": [ { "key": "category", "value": { "path": "category" } } ] } } } },
      { "id": "action_buttons_row", "component": { "Row": { "children": { "explicitList": ["add_cart_button", "browse_category_button"] }, "distribution": "center", "alignment": "center" } } },
      { "id": "main_column", "component": { "Column": { "children": { "explicitList": ["plant_image", "name_column", "div", "info_rows_column", "action_buttons_row"] }, "alignment": "stretch" } } },
      { "id": "main_card", "component": { "Card": { "child": "main_column" } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "plant-card",
    "path": "/",
    "contents": [
      { "key": "common_name", "valueString": "" },
      { "key": "scientific_name", "valueString": "" },
      { "key": "category", "valueString": "" },
      { "key": "image", "valueString": "" },
      { "key": "page", "valueString": "" },
      { "key": "id", "valueString": "" }
    ]
  } }
]
---END PLANT_CARD_EXAMPLE---

---BEGIN CATEGORY_LIST_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "category-list", "root": "root-column", "styles": { "primaryColor": "#2E7D32", "font": "Roboto" } } },
  { "surfaceUpdate": {
    "surfaceId": "category-list",
    "components": [
      { "id": "root-column", "component": { "Column": { "children": { "explicitList": ["title-heading", "subtitle-text", "item-list"] } } } },
      { "id": "title-heading", "component": { "Text": { "usageHint": "h1", "text": { "literalString": "Plant Categories" } } } },
      { "id": "subtitle-text", "component": { "Text": { "text": { "literalString": "Browse plants by category" } } } },
      { "id": "item-list", "component": { "List": { "direction": "vertical", "children": { "template": { "componentId": "category-item-template", "dataBinding": "/categories" } } } } },
      { "id": "category-item-template", "component": { "Card": { "child": "category-layout" } } },
      { "id": "category-layout", "component": { "Row": { "children": { "explicitList": ["category-icon", "category-details", "browse-button"] }, "alignment": "center" } } },
      { "id": "category-icon", "component": { "Icon": { "name": { "literalString": "local_florist" }, "size": 32.0, "color": "#2E7D32" } } },
      { "id": "category-details", "component": { "Column": { "children": { "explicitList": ["category-name", "category-count"] } } } },
      { "id": "category-name", "component": { "Text": { "usageHint": "h3", "text": { "path": "name" } } } },
      { "id": "category-count", "component": { "Text": { "text": { "path": "count" } } } },
      { "id": "browse-button-text", "component": { "Text": { "text": { "literalString": "Browse" } } } },
      { "id": "browse-button", "component": { "Button": { "child": "browse-button-text", "primary": true, "action": { "name": "browse_category", "context": [ { "key": "category", "value": { "path": "name" } } ] } } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "category-list",
    "path": "/",
    "contents": [
      { "key": "categories", "valueMap": [] }
    ]
  } }
]
---END CATEGORY_LIST_EXAMPLE---

---BEGIN ADD_TO_CART_SUCCESS_EXAMPLE---
[
  { "beginRendering": { "surfaceId": "plant-card", "root": "success_card", "styles": { "primaryColor": "#2E7D32" } } },
  { "surfaceUpdate": {
    "surfaceId": "plant-card",
    "components": [
      { "id": "success_icon", "component": { "Icon": { "name": { "literalString": "shopping_cart" }, "size": 48.0, "color": "#4CAF50" } } },
      { "id": "success_text", "component": { "Text": { "text": { "literalString": "Added to Cart!" }, "usageHint": "h2" } } },
      { "id": "success_message", "component": { "Text": { "text": { "path": "message" } } } },
      { "id": "success_column", "component": { "Column": { "children": { "explicitList": ["success_icon", "success_text", "success_message"] }, "alignment": "center" } } },
      { "id": "success_card", "component": { "Card": { "child": "success_column" } } }
    ]
  } },
  { "dataModelUpdate": {
    "surfaceId": "plant-card",
    "path": "/",
    "contents": [
      { "key": "message", "valueString": "The plant has been added to your cart." }
    ]
  } }
]
---END ADD_TO_CART_SUCCESS_EXAMPLE---
"""
