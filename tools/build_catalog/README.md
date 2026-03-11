# Catalog Build Tools

A2UI v0.9+ requires catalogs be free standing, except for references to
`common_types` which are automatically resolved by the A2UI SDK, to simplify LLM
inference and dependency management.

This directory contains two tools for managing and bundling A2UI catalogs:

1. `assemble_catalog.py` (New, Recommended)
2. `build_catalog.py` (Legacy)

---

## 1. assemble_catalog.py

`assemble_catalog.py` is a highly flexible tool for combining multiple
A2UI component and function catalogs into a single unified JSON Schema file. It
natively supports external HTTP refs, automatic GitHub version resolution for
official catalogs, and multi-file merging.

### Key Features

- **Multi-input support**: Pass one or more local file paths or HTTP(S) URLs to
  combine multiple catalogs into one cohesive output.
- **Smart `$ref` Resolution**: Automatically fetches external URLs and
  accurately resolves relative local paths.
- **Official Catalog Interception**: By default, it intercepts references to
  `basic_catalog.json` and `common_types.json` and auto-downloads the official
  A2UI specification from GitHub based on the `--version` provided (defaults to
  `0.9`). If you provide your own local versions in the input list, it will
  intelligently use those instead!
- **Circular Dependency Protection**: Detects and aborts on infinite `$ref`
  loops.
- **Resilient Remote Fetching**: Employs timeouts for network requests and
  provides clear, descriptive errors for missing files or invalid JSON payloads.
- **Collision Warnings**: Logs warnings if components or functions with the same
  name are merged, preventing silent overwrites.
- **Schema Metadata**: Automatically generates `$id`, `catalogId`, `title`, and
  `description` root metadata based on your output `--name`.
- **Automatic `.json` extension**: Ensures the output file is always correctly
  formatted.

### Usage

```bash
uv run tools/build_catalog/assemble_catalog.py [INPUTS ...] --name <OUTPUT_NAME> [--version <VERSION>] [--extend-basic-catalog] [--out-dir <DIR>] [--verbose]
```

### Arguments

- `inputs`: One or more paths or URLs to A2UI component catalog JSONs.
- `--name`: (Required) The desired name of the combined catalog (e.g.
  `my_merged_catalog`). The `.json` extension is appended automatically if
  omitted.
- `--version`: The A2UI specification version to use for official catalog
  fallbacks. Choices are `0.9` or `0.10`. Defaults to `0.9`.
- `--extend-basic-catalog`: If passed, automatically includes the entirety of
  `basic_catalog.json` in the root output regardless of whether the input
  catalogs explicitly reference it.
- `--out-dir`, `-o`: The directory where the assembled catalog will be saved. Defaults to `dist`.
- `--verbose`, `-v`: If passed, enables verbose debug logging to help diagnose issues.

### Examples

**Combine two local catalogs:**

```bash
uv run tools/build_catalog/assemble_catalog.py component1.json component2.json --name merged_catalog
```

**Combine a local catalog with an external URL, enforcing v0.10:**

```bash
uv run tools/build_catalog/assemble_catalog.py local_catalog.json https://example.com/remote_catalog.json --name hybrid_catalog --version 0.10
```

**Build a catalog and explicitly inject all `basic_catalog.json` properties:**

```bash
uv run tools/build_catalog/assemble_catalog.py my_catalog.json --name extended_catalog --extend-basic-catalog
```

Outputs are written to `dist/<OUTPUT_NAME>.json` from your current working
directory.

---

## 2. build_catalog.py (Legacy)

Tool to generate a standalone catalog that bundles all JSON Schema `$ref` from
external files into a single JSON Schema file.

### Use

**1. Author a catalog with references to other catalogs using `$ref`.**

Example catalog (in specification/v0_9/json) that imports Text from the Basic
Catalog to build a simple Popup surface.

```json
{
  "$id": "sample_popup_catalog",
  "components": {
    "allOf": [
      {
        "$ref": "basic_catalog.json#/components/Text"
      },
      {
        "Popup": {
          "type": "object",
          "description": "A modal overlay that displays an icon and text.",
          "properties": {
            "text": {
              "$ref": "common_types.json#/$defs/ComponentId"
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

**2. Run `uv run build_catalog.py <path-to-your-catalog>` to bundle all external
file references into a single, independent JSON Schema file**

Example running build_catalog on the sample catalog

```bash
$ uv run tools/build_catalog/build_catalog.py specification/v0_9/json/sample_popup_catalog.json

📦 Bundling: specification/v0_9/json/sample_popup_catalog.json
✅ Created:  specification/v0_9/json/dist/sample_popup_catalog.json

```

**3. Inspect the output file at `dist/<your-catalog-name>`**

Output from running build_catalog on the sample catalog, with all `$ref` to
external files bundled into a single file.

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
    "basic_catalog_components_Text": {
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
        "$ref": "#/$defs/basic_catalog_components_Text"
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
