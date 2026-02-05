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

RESTAURANT_UI_EXAMPLES = """
---BEGIN SINGLE_COLUMN_LIST_EXAMPLE---
[
  {{ "createSurface": {{ "surfaceId": "default", "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json", "theme": {{ "primaryColor": "#FF0000" }} }} }},
  {{ "updateComponents": {{
    "surfaceId": "default",
    "components": [
      {{ "id": "root", "component": "Column", "children": ["title-heading", "item-list"] }},
      {{ "id": "title-heading", "component": "Text", "variant": "h1", "text": {{ "path": "/title" }} }},
      {{ "id": "item-list", "component": "List", "direction": "vertical", "children": {{ "componentId": "item-card-template", "path": "/items" }} }},
      {{ "id": "item-card-template", "component": "Card", "child": "card-layout" }},
      {{ "id": "card-layout", "component": "Row", "children": ["template-image", "card-details"] }},
      {{ "id": "template-image", "component": "Image", "url": {{ "path": "imageUrl" }} }},
      {{ "id": "card-details", "component": "Column", "children": ["template-name", "template-rating", "template-detail", "template-link", "template-book-button"] }},
      {{ "id": "template-name", "component": "Text", "variant": "h3", "text": {{ "path": "name" }} }},
      {{ "id": "template-rating", "component": "Text", "text": {{ "call": "formatString", "args": {{ "value": "Rating: ${{rating-value}}" }} }} }},
      {{ "id": "template-detail", "component": "Text", "text": {{ "path": "detail" }} }},
      {{ "id": "template-link", "component": "Text", "text": {{ "path": "infoLink" }} }},
      {{ "id": "template-book-button", "component": "Button", "child": "book-now-text", "variant": "primary", "action": {{ "event": {{ "name": "book_restaurant", "context": {{ "restaurantName": {{ "path": "name" }}, "imageUrl": {{ "path": "imageUrl" }}, "address": {{ "path": "address" }} }} }} }} }},
      {{ "id": "book-now-text", "component": "Text", "text": "Book Now" }}
    ]
  }} }},
  {{ "updateDataModel": {{
    "surfaceId": "default",
    "value": {{
      "title": "Top Restaurants",
      "items": [
        {{ "name": "The Fancy Place", "rating-value": 4.8, "detail": "Fine dining experience", "infoLink": "https://example.com/fancy", "imageUrl": "https://example.com/fancy.jpg", "address": "123 Main St" }},
        {{ "name": "Quick Bites", "rating-value": 4.2, "detail": "Casual and fast", "infoLink": "https://example.com/quick", "imageUrl": "https://example.com/quick.jpg", "address": "456 Oak Ave" }}
      ]
    }}
  }} }}
]
---END SINGLE_COLUMN_LIST_EXAMPLE---

---BEGIN TWO_COLUMN_LIST_EXAMPLE---
[
  {{ "createSurface": {{ "surfaceId": "default", "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json", "theme": {{ "primaryColor": "#FF0000" }} }} }},
  {{ "updateComponents": {{
    "surfaceId": "default",
    "components": [
      {{ "id": "root", "component": "Column", "children": ["title-heading", "restaurant-row-1"] }},
      {{ "id": "title-heading", "component": "Text", "variant": "h1", "text": {{ "path": "/title" }} }},
      {{ "id": "restaurant-row-1", "component": "Row", "children": ["item-card-1", "item-card-2"] }},
      {{ "id": "item-card-1", "component": "Card", "child": "card-layout-1" }},
      {{ "id": "card-layout-1", "component": "Column", "children": ["template-image-1", "card-details-1"] }},
      {{ "id": "template-image-1", "component": "Image", "url": {{ "path": "/items/0/imageUrl" }}, "fit": "cover" }},
      {{ "id": "card-details-1", "component": "Column", "children": ["template-name-1", "template-rating-1", "template-detail-1", "template-link-1", "template-book-button-1"] }},
      {{ "id": "template-name-1", "component": "Text", "variant": "h3", "text": {{ "path": "/items/0/name" }} }},
      {{ "id": "template-rating-1", "component": "Text", "text": {{ "call": "formatString", "args": {{ "value": "Rating: ${{/items/0/rating}}" }} }} }},
      {{ "id": "template-detail-1", "component": "Text", "text": {{ "path": "/items/0/detail" }} }},
      {{ "id": "template-link-1", "component": "Text", "text": {{ "path": "/items/0/infoLink" }} }},
      {{ "id": "template-book-button-1", "component": "Button", "child": "book-now-text-1", "action": {{ "event": {{ "name": "book_restaurant", "context": {{ "restaurantName": {{ "path": "/items/0/name" }}, "imageUrl": {{ "path": "/items/0/imageUrl" }}, "address": {{ "path": "/items/0/address" }} }} }} }} }},
      {{ "id": "book-now-text-1", "component": "Text", "text": "Book Now" }},
      {{ "id": "item-card-2", "component": "Card", "child": "card-layout-2" }},
      {{ "id": "card-layout-2", "component": "Column", "children": ["template-image-2", "card-details-2"] }},
      {{ "id": "template-image-2", "component": "Image", "url": {{ "path": "/items/1/imageUrl" }}, "fit": "cover" }},
      {{ "id": "card-details-2", "component": "Column", "children": ["template-name-2", "template-rating-2", "template-detail-2", "template-link-2", "template-book-button-2"] }},
      {{ "id": "template-name-2", "component": "Text", "variant": "h3", "text": {{ "path": "/items/1/name" }} }},
      {{ "id": "template-rating-2", "component": "Text", "text": {{ "call": "formatString", "args": {{ "value": "Rating: ${{/items/1/rating}}" }} }} }},
      {{ "id": "template-detail-2", "component": "Text", "text": {{ "path": "/items/1/detail" }} }},
      {{ "id": "template-link-2", "component": "Text", "text": {{ "path": "/items/1/infoLink" }} }},
      {{ "id": "template-book-button-2", "component": "Button", "child": "book-now-text-2", "action": {{ "event": {{ "name": "book_restaurant", "context": {{ "restaurantName": {{ "path": "/items/1/name" }}, "imageUrl": {{ "path": "/items/1/imageUrl" }}, "address": {{ "path": "/items/1/address" }} }} }} }} }},
      {{ "id": "book-now-text-2", "component": "Text", "text": "Book Now" }}
    ]
  }} }},
  {{ "updateDataModel": {{
    "surfaceId": "default",
    "value": {{
      "title": "Top Restaurants",
      "items": [
        {{ "name": "The Fancy Place", "rating": 4.8, "detail": "Fine dining experience", "infoLink": "https://example.com/fancy", "imageUrl": "https://example.com/fancy.jpg", "address": "123 Main St" }},
        {{ "name": "Quick Bites", "rating": 4.2, "detail": "Casual and fast", "infoLink": "https://example.com/quick", "imageUrl": "https://example.com/quick.jpg", "address": "456 Oak Ave" }}
      ]
    }}
  }} }}
]
---END TWO_COLUMN_LIST_EXAMPLE---

---BEGIN BOOKING_FORM_EXAMPLE---
[
  {{ "createSurface": {{ "surfaceId": "booking-form", "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json", "theme": {{ "primaryColor": "#FF0000" }} }} }},
  {{ "updateComponents": {{
    "surfaceId": "booking-form",
    "components": [
      {{ "id": "root", "component": "Column", "children": ["booking-title", "restaurant-image", "restaurant-address", "party-size-field", "datetime-field", "dietary-field", "submit-button"] }},
      {{ "id": "booking-title", "component": "Text", "variant": "h2", "text": {{ "path": "title" }} }},
      {{ "id": "restaurant-image", "component": "Image", "url": {{ "path": "imageUrl" }} }},
      {{ "id": "restaurant-address", "component": "Text", "text": {{ "path": "address" }} }},
      {{ "id": "party-size-field", "component": "TextField", "label": "Party Size", "value": {{ "path": "partySize" }}, "variant": "number" }},
      {{ "id": "datetime-field", "component": "DateTimeInput", "label": "Date & Time", "value": {{ "path": "reservationTime" }}, "enableDate": true, "enableTime": true }},
      {{ "id": "dietary-field", "component": "TextField", "label": "Dietary Requirements", "value": {{ "path": "dietary" }} }},
      {{ "id": "submit-button", "component": "Button", "child": "submit-reservation-text", "action": {{ "event": {{ "name": "submit_booking", "context": {{ "restaurantName": {{ "path": "restaurantName" }}, "partySize": {{ "path": "partySize" }}, "reservationTime": {{ "path": "reservationTime" }}, "dietary": {{ "path": "dietary" }}, "imageUrl": {{ "path": "imageUrl" }} }} }} }} }},
      {{ "id": "submit-reservation-text", "component": "Text", "text": "Submit Reservation" }}
    ]
  }} }},
  {{ "updateDataModel": {{
    "surfaceId": "booking-form",
    "value": {{
      "title": "Book a Table at [RestaurantName]",
      "address": "[Restaurant Address]",
      "restaurantName": "[RestaurantName]",
      "partySize": "2",
      "reservationTime": "",
      "dietary": "",
      "imageUrl": ""
    }}
  }} }}
]
---END BOOKING_FORM_EXAMPLE---

---BEGIN CONFIRMATION_EXAMPLE---
[
  {{ "createSurface": {{ "surfaceId": "confirmation", "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json", "theme": {{ "primaryColor": "#FF0000" }} }} }},
  {{ "updateComponents": {{
    "surfaceId": "confirmation",
    "components": [
      {{ "id": "root", "component": "Card", "child": "confirmation-column" }},
      {{ "id": "confirmation-column", "component": "Column", "children": ["confirm-title", "confirm-image", "divider1", "confirm-details", "divider2", "confirm-dietary", "divider3", "confirm-text"] }},
      {{ "id": "confirm-title", "component": "Text", "variant": "h2", "text": {{ "path": "title" }} }},
      {{ "id": "confirm-image", "component": "Image", "url": {{ "path": "imageUrl" }} }},
      {{ "id": "confirm-details", "component": "Text", "text": {{ "path": "bookingDetails" }} }},
      {{ "id": "confirm-dietary", "component": "Text", "text": {{ "path": "dietaryRequirements" }} }},
      {{ "id": "confirm-text", "component": "Text", "variant": "h5", "text": "We look forward to seeing you!" }},
      {{ "id": "divider1", "component": "Divider" }},
      {{ "id": "divider2", "component": "Divider" }},
      {{ "id": "divider3", "component": "Divider" }}
    ]
  }} }},
  {{ "updateDataModel": {{
    "surfaceId": "confirmation",
    "value": {{
      "title": "Booking at [RestaurantName]",
      "bookingDetails": "[PartySize] people at [Time]",
      "dietaryRequirements": "Dietary Requirements: [Requirements]",
      "imageUrl": "[ImageUrl]"
    }}
  }} }}
]
---END CONFIRMATION_EXAMPLE---
"""
