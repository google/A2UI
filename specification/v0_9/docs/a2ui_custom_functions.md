# Extending A2UI with Custom Functions

A2UI functions are designed to be extensible. Third-party developers can define
their own
function catalogs while preserving strict validation for the standard set.

This guide demonstrates how to create a `custom_catalog.json` that adds a string
`trim` function and a hardware query function (`getScreenResolution`).

## 1. Define the Custom Catalog

Create a JSON Schema file (e.g., `custom_catalog.json`) that defines your
function parameters.

Use the `functions` property to define a map of function schemas, and a group in `$defs` to collect them.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/custom_catalog.json",
  "title": "Custom Function Catalog",
  "description": "Extension catalog adding string trimming and screen resolution functions.",
  "functions": {
    "trim": {
      "type": "object",
      "properties": {
        "call": { "const": "trim" },
        "returnType": { "const": "string" },
        "args": {
          "type": "array",
          "minItems": 1,
          "maxItems": 2,
          "prefixItems": [
            {
              "$ref": "https://a2ui.dev/specification/v0_9/common_types.json#/$defs/DynamicString",
              "description": "The string to trim."
            },
            {
              "$ref": "https://a2ui.dev/specification/v0_9/common_types.json#/$defs/DynamicString",
              "description": "Optional. A set of characters to remove. Defaults to whitespace."
            }
          ]
        }
      },
      "required": ["call", "args"]
    },
    "getScreenResolution": {
      "type": "object",
      "properties": {
        "call": { "const": "getScreenResolution" },
        "returnType": { "const": "array" },
        "args": {
          "type": "array",
          "minItems": 0,
          "maxItems": 1,
          "prefixItems": [
            {
              "$ref": "https://a2ui.dev/specification/v0_9/common_types.json#/$defs/DynamicNumber",
              "description": "Optional. The index of the screen to query. Defaults to 0 (primary screen)."
            }
          ]
        }
      },
      "required": ["call"]
    }
  },
  "$defs": {
    "CustomFunctions": {
      "oneOf": [
        { "$ref": "#/functions/trim" },
        { "$ref": "#/functions/getScreenResolution" }
      ]
    }
  }
}
```

## 2. Combine with the Standard Schema

To use this custom catalog in your application, you must define an "Application
Schema" that extends the base A2UI schema. You do this by overriding the
`FunctionCall` definition to include your new function definitions.

Because `common_types.json` defines `FunctionCall` as a choice (`oneOf`), you
simply create a new list of choices that includes both the standard and custom
function groups.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/my_app_schema.json",
  // Import definitions from the standard schema
  "$defs": {
    "FunctionCall": {
      "description": "Invokes a standard OR custom function.",
      "oneOf": [
        // 1. Allow all standard functions
        {
          "$ref": "https://a2ui.dev/specification/v0_9/standard_catalog.json#/$defs/StandardFunctions"
        },
        // 2. Allow the custom functions
        {
          "$ref": "https://example.com/schemas/custom_catalog.json#/$defs/CustomFunctions"
        }

        // 3. (Optional) Allow fallback for other functions if strict validation isn't desired
        // { "$ref": "https://a2ui.dev/specification/v0_9/standard_catalog.json#/$defs/GenericFunction" }
      ]
    }
  }

  // ... verify the rest of your message structure here ...
}
```

## How Validation Works

When a `FunctionCall` is validated against this combined schema:

1. **Discriminator Lookup:** The validator looks at the `call` property of the
   object.
2. **Schema Matching:**
    * If `call` is "length", it matches `StandardFunctions` -> `length`
      and validates the arguments against the length rules.
    * If `call` is "trim", it matches `CustomFunctions` -> `trim` and
      validates against your custom rules.
    * If `call` is "unknownFunc":
        * If `GenericFunction` is NOT included, validation FAILS immediately (
          strict mode).
        * If `GenericFunction` IS included, it matches the generic fallback and
          PASSES (loose mode).

This strict-by-default approach ensures typos are caught early, while the
modular structure makes it easy to add new capabilities.
