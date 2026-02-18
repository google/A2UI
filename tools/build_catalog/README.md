# build_catalog

Tool to generate a standalone catalog that bundles all JSON Schema `$ref` from external files into a single JSON Schema file. 

A2UI requires catalogs be free standing to simplify LLM inference and dependency management.

## Use

**1. Author a catalog with references to other catalogs using `$ref`.**

Example catalog (in specification/v0_9/json) that imports Text from the Basic Catalog to build a simple Popup surface.

```json
{
  "$id": "sample_popup_catalog",
  "components": {
    "allOf": [
      { "$ref": "standard_catalog.json#/components/Text" },
      {
        "Popup": {
          "type": "object",
          "description": "A modal overlay that displays an icon and text.",
          "properties": {
            "text": { "$ref": "common_types.json#/$defs/ComponentId" }
          },
          "required": [ "text" ]
        }
      }
    ]
  }
}
```

**2. Run `uv run build_catalog.py <path-to-your-catalog` to bundle all external file references into a single, independent JSON Schema file**

Example running build_catalog on the sample catalog

```bash
$ uv run tools/build_catalog/build_catalog.py specification/v0_9/json/sample_popup_catalog.json

📦 Bundling: specification/v0_9/json/sample_popup_catalog.json
✅ Created:  specification/v0_9/json/dist/sample_popup_catalog.json

```

**3. Inspect the output file at `dist/<your-catalog-name>`**

Output from running build_catalog on the sample catalog, with all `$ref` to external files bundled into a single file.

```json
{
  "$defs": {
    "common_types_$defs_ComponentCommon": {
      "type": "object",
      "properties": {
        "id": {
          "$ref": "#/$defs/ComponentId"
        },
        "accessibility": {
          "$ref": "#/$defs/AccessibilityAttributes"
        }
      },
      "required": [
        "id"
      ]
    },
    "common_types_$defs_DynamicString": {
      "description": "Represents a string",
      "oneOf": [
        {
          "type": "string"
        },
        {
          "$ref": "#/$defs/DataBinding"
        },
        {
          "allOf": [
            {
              "$ref": "#/$defs/FunctionCall"
            },
            {
              "properties": {
                "returnType": {
                  "const": "string"
                }
              }
            }
          ]
        }
      ]
    },
    "standard_catalog_components_Text": {
      "type": "object",
      "allOf": [
        {
          "$ref": "#/$defs/common_types_$defs_ComponentCommon"
        },
        {
          "$ref": "#/$defs/CatalogComponentCommon"
        },
        {
          "type": "object",
          "properties": {
            "component": {
              "const": "Text"
            },
            "text": {
              "$ref": "#/$defs/common_types_$defs_DynamicString",
              "description": "The text content to display. While simple Markdown formatting is supported (i.e. without HTML, images, or links), utilizing dedicated UI components is generally preferred for a richer and more structured presentation."
            },
            "variant": {
              "type": "string",
              "description": "A hint for the base text style.",
              "enum": [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "caption",
                "body"
              ]
            }
          },
          "required": [
            "component",
            "text"
          ]
        }
      ],
      "unevaluatedProperties": false
    },
    "common_types_$defs_ComponentId": {
      "type": "string",
      "description": "The unique identifier for a component, used for both definitions and references within the same surface."
    }
  },
  "$id": "sample_popup_catalog",
  "components": {
    "allOf": [
      {
        "$ref": "#/$defs/standard_catalog_components_Text"
      },
      {
        "Popup": {
          "type": "object",
          "description": "A modal overlay that displays an icon and text.",
          "properties": {
            "text": {
              "$ref": "#/$defs/common_types_$defs_ComponentId"
            }
          },
          "required": [
            "text"
          ]
        }
      }
    ]
  }
}
```