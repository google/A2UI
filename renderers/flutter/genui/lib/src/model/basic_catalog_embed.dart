// Copyright 2025 The Flutter Authors.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/// A static container for the basic catalog and rules, embedded to avoid
/// file I/O and duplication across providers.
class BasicCatalogEmbed {
  /// The text content of basic_catalog_rules.txt.
  static const String basicCatalogRules = r'''
**REQUIRED PROPERTIES:** You MUST include ALL required properties for every component, even if they are inside a template or will be bound to data.
- For 'Text', you MUST provide 'text'. If dynamic, use { "path": "..." }.
- For 'Image', you MUST provide 'url'. If dynamic, use { "path": "..." }.
- For 'Button', you MUST provide 'action'.
- For 'TextField', 'CheckBox', etc., you MUST provide 'label'.

**OUTPUT FORMAT:**
You must output a VALID JSON object representing one of the A2UI message types (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`).
- Do NOT use function blocks or tool calls for these messages.
- You can treat the A2UI schema as a specification for the JSON you typically output.
- You may include a brief conversational explanation before or after the JSON block if it helps the user, but the JSON block must be valid and complete.
- Ensure your JSON is fenced with ```json and ```.

**EXAMPLES:**

1. Create a surface:
```json
{
  "version": "v0.9",
  "createSurface": {
    "surfaceId": "main",
    "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json",
    "sendDataModel": true
  }
}
```

2. Update components:
```json
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        // The root component MUST have id "root"
        "id": "root",
        "component": "Column",
        "justify": "start",
        "children": [
          "headerText",
          "content"
        ]
      }
    ]
  }
}
```

**IMPORTANT:**
- One of the components sent in one of the `updateComponents` MUST have id "root", or nothing will be displayed.
- Do NOT nest `components` inside `createSurface`. Use `updateComponents` to add components to a surface.
- `createSurface` ONLY sets up the surface (ID and catalog). It does NOT take content.
- To show a UI, you typically send a `createSurface` message (if the surface doesn't exist), followed by an `updateComponents` message.
''';
}
