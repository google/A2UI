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

"""A2UI examples for the Landscape Architect agent."""

LANDSCAPE_UI_EXAMPLES = """
---BEGIN WELCOME_SCREEN_EXAMPLE---
Use this when the user sends a greeting or starts the app:

[
  {{ "beginRendering": {{ "surfaceId": "welcome", "root": "welcome-column", "styles": {{ "primaryColor": "#4CAF50", "font": "Roboto" }} }} }},
  {{ "surfaceUpdate": {{
    "surfaceId": "welcome",
    "components": [
      {{ "id": "welcome-column", "component": {{ "Column": {{ "alignment": "center", "distribution": "center", "children": {{ "explicitList": ["welcome-icon", "welcome-title", "welcome-subtitle", "start-button"] }} }} }} }},
      {{ "id": "welcome-icon", "component": {{ "Icon": {{ "name": {{ "literalString": "home" }} }} }} }},
      {{ "id": "welcome-title", "component": {{ "Text": {{ "usageHint": "h1", "text": {{ "literalString": "🌿 Landscape Architect AI" }} }} }} }},
      {{ "id": "welcome-subtitle", "component": {{ "Text": {{ "text": {{ "literalString": "Transform your outdoor space with AI-powered design. Upload a photo and get a custom landscaping plan." }} }} }} }},
      {{ "id": "start-button", "component": {{ "Button": {{ "child": "start-button-text", "primary": true, "action": {{ "name": "start_project" }} }} }} }},
      {{ "id": "start-button-text", "component": {{ "Text": {{ "text": {{ "literalString": "Start My Project" }} }} }} }}
    ]
  }} }}
]
---END WELCOME_SCREEN_EXAMPLE---

---BEGIN PHOTO_UPLOAD_EXAMPLE---
Use this when the user wants to start a project:

[
  {{ "beginRendering": {{ "surfaceId": "upload", "root": "upload-column", "styles": {{ "primaryColor": "#4CAF50", "font": "Roboto" }} }} }},
  {{ "surfaceUpdate": {{
    "surfaceId": "upload",
    "components": [
      {{ "id": "upload-column", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["upload-title", "upload-subtitle", "upload-card", "tips-card"] }} }} }} }},
      {{ "id": "upload-title", "component": {{ "Text": {{ "usageHint": "h2", "text": {{ "literalString": "📸 Upload Your Space" }} }} }} }},
      {{ "id": "upload-subtitle", "component": {{ "Text": {{ "text": {{ "literalString": "Take or upload a photo of your outdoor area. I'll analyze it and create a custom questionnaire for your landscaping project." }} }} }} }},
      
      {{ "id": "upload-card", "component": {{ "Card": {{ "child": "upload-options" }} }} }},
      {{ "id": "upload-options", "component": {{ "Column": {{ "children": {{ "explicitList": ["camera-row", "gallery-row"] }} }} }} }},
      
      {{ "id": "camera-row", "component": {{ "Row": {{ "distribution": "start", "alignment": "center", "children": {{ "explicitList": ["camera-icon", "camera-text"] }} }} }} }},
      {{ "id": "camera-icon", "component": {{ "Icon": {{ "name": {{ "literalString": "camera" }} }} }} }},
      {{ "id": "camera-text", "component": {{ "Text": {{ "text": {{ "literalString": "Take a photo of your yard" }} }} }} }},
      
      {{ "id": "gallery-row", "component": {{ "Row": {{ "distribution": "start", "alignment": "center", "children": {{ "explicitList": ["gallery-icon", "gallery-text"] }} }} }} }},
      {{ "id": "gallery-icon", "component": {{ "Icon": {{ "name": {{ "literalString": "photo" }} }} }} }},
      {{ "id": "gallery-text", "component": {{ "Text": {{ "text": {{ "literalString": "Choose from your photo library" }} }} }} }},
      
      {{ "id": "tips-card", "component": {{ "Card": {{ "child": "tips-content" }} }} }},
      {{ "id": "tips-content", "component": {{ "Column": {{ "children": {{ "explicitList": ["tips-title", "tip1", "tip2", "tip3"] }} }} }} }},
      {{ "id": "tips-title", "component": {{ "Text": {{ "usageHint": "h4", "text": {{ "literalString": "💡 Tips for the best results:" }} }} }} }},
      {{ "id": "tip1", "component": {{ "Text": {{ "text": {{ "literalString": "• Capture the full area you want to transform" }} }} }} }},
      {{ "id": "tip2", "component": {{ "Text": {{ "text": {{ "literalString": "• Include any structures like fences, patios, or sheds" }} }} }} }},
      {{ "id": "tip3", "component": {{ "Text": {{ "text": {{ "literalString": "• Natural daylight works best" }} }} }} }},

      {{ "id": "upload-button", "component": {{ "Button": {{ "child": "upload-button-text", "primary": true, "action": {{ "name": "upload_photo" }} }} }} }},
      {{ "id": "upload-button-text", "component": {{ "Text": {{ "text": {{ "literalString": "Upload Photo" }} }} }} }}
    ]
  }} }}
]
---END PHOTO_UPLOAD_EXAMPLE---

---BEGIN DYNAMIC_QUESTIONNAIRE_EXAMPLE---
Use this after analyzing the user's photo. CUSTOMIZE the questions based on what you observe in their landscape:

[
  {{ "beginRendering": {{ "surfaceId": "questionnaire", "root": "q-column", "styles": {{ "primaryColor": "#4CAF50", "font": "Roboto" }} }} }},
  {{ "surfaceUpdate": {{
    "surfaceId": "questionnaire",
    "components": [
      {{ "id": "q-column", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["user-photo", "q-title", "q-subtitle", "lawn-question", "patio-question", "budget-slider-title", "budget-slider", "style-question", "maintenance-question", "submit-button"] }} }} }} }},

      {{ "id": "user-photo", "component": {{ "Image": {{ "url": {{ "path": "imageUrl" }}, "fit": "cover", "usageHint": "largeFeature" }} }} }},

      {{ "id": "q-title", "component": {{ "Text": {{ "usageHint": "h2", "text": {{ "literalString": "🌱 Let's Design Your Space" }} }} }} }},
      {{ "id": "q-subtitle", "component": {{ "Text": {{ "text": {{ "literalString": "Based on your photo, I've prepared some questions to understand your vision." }} }} }} }},

      {{ "id": "lawn-question", "component": {{ "MultipleChoice": {{
        "selections": {{ "path": "lawnPlan" }},
        "maxAllowedSelections": 1,
        "options": [
          {{ "label": {{ "literalString": "Keep current lawn" }}, "value": "keep" }},
          {{ "label": {{ "literalString": "Add flower beds" }}, "value": "flower_beds" }},
          {{ "label": {{ "literalString": "Replace with native plants" }}, "value": "native" }},
          {{ "label": {{ "literalString": "Install artificial turf" }}, "value": "artificial" }}
        ]
      }} }} }},

      {{ "id": "patio-question", "component": {{ "MultipleChoice": {{
        "selections": {{ "path": "patioPlan" }},
        "maxAllowedSelections": 1,
        "options": [
          {{ "label": {{ "literalString": "Keep existing patio" }}, "value": "keep" }},
          {{ "label": {{ "literalString": "Expand the space" }}, "value": "expand" }},
          {{ "label": {{ "literalString": "Add a pergola" }}, "value": "pergola" }},
          {{ "label": {{ "literalString": "Replace with deck" }}, "value": "deck" }}
        ]
      }} }} }},

      {{ "id": "budget-slider-title", "component": {{ "Text": {{ "usageHint": "h5", "text": {{ "literalString": "💰 What's your budget range?" }} }} }} }},
      {{ "id": "budget-slider", "component": {{ "Slider": {{ "value": {{ "path": "budget" }}, "minValue": 1000, "maxValue": 50000 }} }} }},

      {{ "id": "style-question", "component": {{ "MultipleChoice": {{
        "selections": {{ "path": "style" }},
        "maxAllowedSelections": 1,
        "options": [
          {{ "label": {{ "literalString": "Modern/Contemporary" }}, "value": "modern" }},
          {{ "label": {{ "literalString": "Traditional/Classic" }}, "value": "traditional" }},
          {{ "label": {{ "literalString": "Cottage Garden" }}, "value": "cottage" }},
          {{ "label": {{ "literalString": "Mediterranean" }}, "value": "mediterranean" }},
          {{ "label": {{ "literalString": "Zen/Japanese" }}, "value": "zen" }}
        ]
      }} }} }},

      {{ "id": "maintenance-question", "component": {{ "MultipleChoice": {{
        "selections": {{ "path": "maintenance" }},
        "maxAllowedSelections": 1,
        "options": [
          {{ "label": {{ "literalString": "Low - Minimal upkeep" }}, "value": "low" }},
          {{ "label": {{ "literalString": "Medium - Weekly care" }}, "value": "medium" }},
          {{ "label": {{ "literalString": "High - I love gardening!" }}, "value": "high" }}
        ]
      }} }} }},

      {{ "id": "submit-button", "component": {{ "Button": {{ "child": "submit-button-text", "primary": true, "action": {{ "name": "submit_questionnaire", "context": [
        {{ "key": "budget", "value": {{ "path": "budget" }} }},
        {{ "key": "style", "value": {{ "path": "style" }} }},
        {{ "key": "maintenance", "value": {{ "path": "maintenance" }} }},
        {{ "key": "lawnPlan", "value": {{ "path": "lawnPlan" }} }},
        {{ "key": "patioPlan", "value": {{ "path": "patioPlan" }} }}
      ] }} }} }} }},
      {{ "id": "submit-button-text", "component": {{ "Text": {{ "text": {{ "literalString": "Generate Design Options" }} }} }} }}
    ]
  }} }},
  {{ "dataModelUpdate": {{
    "surfaceId": "questionnaire",
    "path": "/",
    "contents": [
      {{ "key": "imageUrl", "valueString": "<uploaded_image_url>" }},
      {{ "key": "budget", "valueNumber": 10000 }},
      {{ "key": "style", "valueArray": ["modern"] }},
      {{ "key": "maintenance", "valueArray": ["medium"] }},
      {{ "key": "lawnPlan", "valueArray": ["keep"] }},
      {{ "key": "patioPlan", "valueArray": ["keep"] }}
    ]
  }} }}
]
---END DYNAMIC_QUESTIONNAIRE_EXAMPLE---

---BEGIN DESIGN_OPTIONS_EXAMPLE---
Use this after processing the questionnaire to show design options:

[
  {{ "beginRendering": {{ "surfaceId": "options", "root": "options-column", "styles": {{ "primaryColor": "#4CAF50", "font": "Roboto" }} }} }},
  {{ "surfaceUpdate": {{
    "surfaceId": "options",
    "components": [
      {{ "id": "options-column", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["options-title", "options-subtitle", "option-card-1", "option-card-2"] }} }} }} }},

      {{ "id": "options-title", "component": {{ "Text": {{ "usageHint": "h2", "text": {{ "literalString": "🎨 Your Design Options" }} }} }} }},
      {{ "id": "options-subtitle", "component": {{ "Text": {{ "text": {{ "literalString": "Based on your preferences, here are my top recommendations:" }} }} }} }},

      {{ "id": "option-card-1", "component": {{ "Card": {{ "child": "option-1-content" }} }} }},
      {{ "id": "option-1-content", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["option-1-name", "option-1-price", "option-1-time", "option-1-desc", "option-1-includes-title", "option-1-includes", "select-button-1"] }} }} }} }},
      {{ "id": "option-1-name", "component": {{ "Text": {{ "usageHint": "h3", "text": {{ "path": "/options/option1/name" }} }} }} }},
      {{ "id": "option-1-price", "component": {{ "Text": {{ "usageHint": "h4", "text": {{ "path": "/options/option1/price" }} }} }} }},
      {{ "id": "option-1-time", "component": {{ "Text": {{ "text": {{ "path": "/options/option1/timeline" }} }} }} }},
      {{ "id": "option-1-desc", "component": {{ "Text": {{ "text": {{ "path": "/options/option1/description" }} }} }} }},
      {{ "id": "option-1-includes-title", "component": {{ "Text": {{ "usageHint": "h5", "text": {{ "literalString": "Includes:" }} }} }} }},
      {{ "id": "option-1-includes", "component": {{ "Text": {{ "text": {{ "path": "/options/option1/includes" }} }} }} }},
      {{ "id": "select-button-1", "component": {{ "Button": {{ "primary": true, "child": "select-text-1", "action": {{ "name": "select_design", "context": [ {{ "key": "designName", "value": {{ "path": "/options/option1/name" }} }}, {{ "key": "designPrice", "value": {{ "path": "/options/option1/price" }} }} ] }} }} }} }},
      {{ "id": "select-text-1", "component": {{ "Text": {{ "text": {{ "literalString": "Select This Design" }} }} }} }},

      {{ "id": "option-card-2", "component": {{ "Card": {{ "child": "option-2-content" }} }} }},
      {{ "id": "option-2-content", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["option-2-name", "option-2-price", "option-2-time", "option-2-desc", "option-2-includes-title", "option-2-includes", "select-button-2"] }} }} }} }},
      {{ "id": "option-2-name", "component": {{ "Text": {{ "usageHint": "h3", "text": {{ "path": "/options/option2/name" }} }} }} }},
      {{ "id": "option-2-price", "component": {{ "Text": {{ "usageHint": "h4", "text": {{ "path": "/options/option2/price" }} }} }} }},
      {{ "id": "option-2-time", "component": {{ "Text": {{ "text": {{ "path": "/options/option2/timeline" }} }} }} }},
      {{ "id": "option-2-desc", "component": {{ "Text": {{ "text": {{ "path": "/options/option2/description" }} }} }} }},
      {{ "id": "option-2-includes-title", "component": {{ "Text": {{ "usageHint": "h5", "text": {{ "literalString": "Includes:" }} }} }} }},
      {{ "id": "option-2-includes", "component": {{ "Text": {{ "text": {{ "path": "/options/option2/includes" }} }} }} }},
      {{ "id": "select-button-2", "component": {{ "Button": {{ "primary": false, "child": "select-text-2", "action": {{ "name": "select_design", "context": [ {{ "key": "designName", "value": {{ "path": "/options/option2/name" }} }}, {{ "key": "designPrice", "value": {{ "path": "/options/option2/price" }} }} ] }} }} }} }},
      {{ "id": "select-text-2", "component": {{ "Text": {{ "text": {{ "literalString": "Select This Design" }} }} }} }}
    ]
  }} }},
  {{ "dataModelUpdate": {{
    "surfaceId": "options",
    "path": "/",
    "contents": [
      {{ "key": "options", "valueMap": [
        {{ "key": "option1", "valueMap": [
          {{ "key": "name", "valueString": "Essential Garden Refresh" }},
          {{ "key": "price", "valueString": "$3,000 - $5,000" }},
          {{ "key": "timeline", "valueString": "⏱️ 1-2 weeks" }},
          {{ "key": "description", "valueString": "A budget-friendly update focusing on key improvements." }},
          {{ "key": "includes", "valueString": "• New plant selections\\n• Mulching and edging\\n• Basic lighting\\n• Lawn renovation" }}
        ] }},
        {{ "key": "option2", "valueMap": [
          {{ "key": "name", "valueString": "Modern Transformation" }},
          {{ "key": "price", "valueString": "$10,000 - $15,000" }},
          {{ "key": "timeline", "valueString": "⏱️ 3-4 weeks" }},
          {{ "key": "description", "valueString": "A comprehensive redesign in the modern style." }},
          {{ "key": "includes", "valueString": "• Complete landscape redesign\\n• New patio or deck\\n• Professional plantings\\n• Irrigation system\\n• Landscape lighting" }}
        ] }}
      ] }}
    ]
  }} }}
]
---END DESIGN_OPTIONS_EXAMPLE---

---BEGIN PROJECT_ESTIMATE_EXAMPLE---
Use this when the user selects a design to show the project estimate:

[
  {{ "beginRendering": {{ "surfaceId": "estimate", "root": "estimate-column", "styles": {{ "primaryColor": "#4CAF50", "font": "Roboto" }} }} }},
  {{ "surfaceUpdate": {{
    "surfaceId": "estimate",
    "components": [
      {{ "id": "estimate-column", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["estimate-title", "estimate-card", "timeline-card", "next-steps-card", "confirm-button"] }} }} }} }},

      {{ "id": "estimate-title", "component": {{ "Text": {{ "usageHint": "h2", "text": {{ "literalString": "📋 Project Estimate" }} }} }} }},

      {{ "id": "estimate-card", "component": {{ "Card": {{ "child": "estimate-content" }} }} }},
      {{ "id": "estimate-content", "component": {{ "Column": {{ "alignment": "stretch", "children": {{ "explicitList": ["design-name", "estimate-number", "cost-breakdown", "total-cost"] }} }} }} }},
      {{ "id": "design-name", "component": {{ "Text": {{ "usageHint": "h3", "text": {{ "path": "designName" }} }} }} }},
      {{ "id": "estimate-number", "component": {{ "Text": {{ "usageHint": "caption", "text": {{ "path": "estimateNumber" }} }} }} }},
      {{ "id": "cost-breakdown", "component": {{ "List": {{ "direction": "vertical", "children": {{ "template": {{ "componentId": "cost-item-template", "dataBinding": "/lineItems" }} }} }} }} }},
      {{ "id": "cost-item-template", "component": {{ "Row": {{ "distribution": "spaceBetween", "children": {{ "explicitList": ["cost-item-name", "cost-item-price"] }} }} }} }},
      {{ "id": "cost-item-name", "component": {{ "Text": {{ "text": {{ "path": "item" }} }} }} }},
      {{ "id": "cost-item-price", "component": {{ "Text": {{ "text": {{ "path": "cost" }} }} }} }},
      {{ "id": "total-cost", "component": {{ "Text": {{ "usageHint": "h3", "text": {{ "path": "total" }} }} }} }},

      {{ "id": "timeline-card", "component": {{ "Card": {{ "child": "timeline-content" }} }} }},
      {{ "id": "timeline-content", "component": {{ "Column": {{ "children": {{ "explicitList": ["timeline-title", "timeline-details"] }} }} }} }},
      {{ "id": "timeline-title", "component": {{ "Text": {{ "usageHint": "h4", "text": {{ "literalString": "📅 Timeline" }} }} }} }},
      {{ "id": "timeline-details", "component": {{ "Text": {{ "text": {{ "path": "timelineText" }} }} }} }},

      {{ "id": "next-steps-card", "component": {{ "Card": {{ "child": "next-steps-content" }} }} }},
      {{ "id": "next-steps-content", "component": {{ "Column": {{ "children": {{ "explicitList": ["next-steps-title", "next-steps-list"] }} }} }} }},
      {{ "id": "next-steps-title", "component": {{ "Text": {{ "usageHint": "h4", "text": {{ "literalString": "✅ Next Steps" }} }} }} }},
      {{ "id": "next-steps-list", "component": {{ "Text": {{ "text": {{ "path": "nextSteps" }} }} }} }},

      {{ "id": "confirm-button", "component": {{ "Button": {{ "child": "confirm-button-text", "primary": true, "action": {{ "name": "confirm_project" }} }} }} }},
      {{ "id": "confirm-button-text", "component": {{ "Text": {{ "text": {{ "literalString": "Schedule Consultation" }} }} }} }}
    ]
  }} }},
  {{ "dataModelUpdate": {{
    "surfaceId": "estimate",
    "path": "/",
    "contents": [
      {{ "key": "designName", "valueString": "Modern Transformation" }},
      {{ "key": "estimateNumber", "valueString": "Estimate #LA-1234" }},
      {{ "key": "lineItems", "valueMap": [
        {{ "key": "item1", "valueMap": [ {{ "key": "item", "valueString": "Design & Planning" }}, {{ "key": "cost", "valueString": "$1,200" }} ] }},
        {{ "key": "item2", "valueMap": [ {{ "key": "item", "valueString": "Materials & Plants" }}, {{ "key": "cost", "valueString": "$4,800" }} ] }},
        {{ "key": "item3", "valueMap": [ {{ "key": "item", "valueString": "Labor & Installation" }}, {{ "key": "cost", "valueString": "$4,200" }} ] }},
        {{ "key": "item4", "valueMap": [ {{ "key": "item", "valueString": "Equipment & Rentals" }}, {{ "key": "cost", "valueString": "$1,200" }} ] }},
        {{ "key": "item5", "valueMap": [ {{ "key": "item", "valueString": "Cleanup & Finishing" }}, {{ "key": "cost", "valueString": "$600" }} ] }}
      ] }},
      {{ "key": "total", "valueString": "Total: $12,960 (including tax)" }},
      {{ "key": "timelineText", "valueString": "• Design Phase: 1 week\\n• Material Procurement: 1-2 weeks\\n• Installation: 2-3 weeks\\n• Total: 4-6 weeks" }},
      {{ "key": "nextSteps", "valueString": "1. Schedule on-site consultation\\n2. Finalize design details\\n3. Review and sign contract\\n4. Schedule installation date" }}
    ]
  }} }}
]
---END PROJECT_ESTIMATE_EXAMPLE---
"""
