# Schema Support and Inline Catalogs in v0.9 Web Renderers

**Status:** Draft
**Target Version:** 0.9

## Overview

This document describes the design for implementing schema validation and `inlineCatalogs` support in the A2UI v0.9 web renderers. The goal is to allow `Catalog` and `Component` definitions to be self-describing using Zod schemas. This enables:

1.  **Runtime Validation:** The core framework can validate incoming component properties against their schema during rendering, ensuring robustness.
2.  **Capability Discovery:** The client can generate a machine-readable definition of its supported components (including custom ones) to send to the server via `clientCapabilities`. This supports the "Prompt-First" philosophy by allowing the Agent to learn the available tools (components) dynamically.

## Architecture Changes

The primary changes involve the `web_core` library, specifically the `Catalog` and `Component` interfaces and the `A2uiMessageProcessor`.

### 1. Component Interface Update

The `Component` interface will be updated to include a required `schema` property. This schema will be defined using the [Zod](https://zod.dev/) library.

**File:** `renderers/web_core/src/v0_9/catalog/types.ts`

```typescript
import { z } from 'zod';

export interface Component<T> {
  readonly name: string;
  
  /**
   * The Zod schema describing the **custom properties** of this component.
   * 
   * - MUST include catalog-specific common properties (e.g. 'weight').
   * - MUST NOT include 'component', 'id', or 'accessibility' as those are 
   *   handled by the framework/envelope.
   */
  readonly schema: z.ZodType<any>;

  render(context: ComponentContext<T>): T;
}
```

### 2. Common Types Definition

To ensure generated schemas correctly reference shared definitions (like `DynamicString` or `Action`), we will expose a set of standard Zod schemas in `web_core`.

**File:** `renderers/web_core/src/v0_9/catalog/schema_types.ts` (New)

```typescript
import { z } from 'zod';

// Helper to tag a schema as a reference to common_types.json
export const withRef = <T extends z.ZodTypeAny>(ref: string, schema: T) => {
  return schema.describe(`REF:${ref}`);
};

export const CommonTypes = {
  DynamicString: withRef(
    'common_types.json#/$defs/DynamicString',
    z.union([z.string(), z.object({ path: z.string() }) /* ... full definition ... */])
  ),
  Action: withRef(
    'common_types.json#/$defs/Action',
    z.object({ /* ... */ })
  ),
  // ... other common types
};
```

### 3. Core Validation Logic

Validation will be centralized in the `ComponentContext` (or a helper used by it). When a component is about to be rendered, the framework will validate the raw properties against the component's Zod schema.

**File:** `renderers/web_core/src/v0_9/rendering/component-context.ts`

```typescript
export class ComponentContext<T> {
  // ...
  
  validate(schema: z.ZodType<any>): boolean {
    const result = schema.safeParse(this.properties);
    if (!result.success) {
      console.warn(`Validation failed for ${this.id}:`, result.error);
      // Logic to handle error (e.g. render error boundary or fallback)
      return false;
    }
    return true;
  }
}
```

*Note: Strict validation can be toggled. For v0.9, we might log warnings rather than crashing the render to support progressive/partial updates.*

## Client Capabilities Generation

The `A2uiMessageProcessor` will provide a method to generate the `a2uiClientCapabilities` object. This process involves transforming the runtime Zod schemas into the specific JSON Schema format required by the A2UI protocol (specifically matching the structure of `standard_catalog.json`).

### 1. Replicating the Component Schema Format

The Zod schema defined in a `Component` implementation represents only the **component-specific properties** (e.g., `text`, `variant` for a Text component). It does *not* include the protocol-level fields like `id`, `component`, or `weight`, nor does it explicitly include the `ComponentCommon` mixins.

To replicate the `standard_catalog.json` format, the generator must **wrap** the converted Zod schema.

**Transformation Logic:**

For each component `(name, component)` in a catalog:
1.  Convert `component.schema` (Zod) to a JSON Schema object.
2.  Wrap it in the standard A2UI envelope structure:
    ```json
    {
      "type": "object",
      "allOf": [
        { "$ref": "common_types.json#/$defs/ComponentCommon" },
        { "$ref": "#/$defs/CatalogComponentCommon" },
        {
          "type": "object",
          "properties": {
            "component": { "const": "<ComponentName>" },
            // ... properties from Zod conversion ...
          },
          "required": ["component", ... ]
        }
      ],
      "unevaluatedProperties": false
    }
    ```

### 2. Generating `anyComponent`

For validation and inference, a Catalog often defines an `anyComponent` type which is a discriminated union of all available components. While the `a2ui_client_capabilities.json` schema currently defines the `components` map, the server (or the generator) often requires this union for complete validation logic.

The generator will construct this `oneOf` array dynamically:

```typescript
const anyComponent = {
  "oneOf": [
    { "$ref": "#/components/Text" },
    { "$ref": "#/components/Button" },
    // ... for all components in the catalog
  ],
  "discriminator": {
    "propertyName": "component"
  }
};
```

*Note: If the strict `a2ui_client_capabilities.json` schema does not allow arbitrary `$defs` in the `inlineCatalogs` objects, this derived structure serves as the logical model used for server-side validation construction or is added if the schema permits extensions.*

### 3. Capabilities API

The method will allow the caller to specify which catalogs should be fully serialized (sent as `inlineCatalogs`). This is useful for sending custom catalogs that the server might not know about, while omitting the schema for the Standard Catalog (sending only its ID) to save bandwidth.

**File:** `renderers/web_core/src/v0_9/processing/message-processor.ts`

```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Catalog } from '../../catalog/types.js';

export interface ClientCapabilitiesOptions {
  /**
   * A list of Catalog instances that should be serialized 
   * and sent as 'inlineCatalogs'.
   */
  inlineCatalogs?: Catalog<any>[];
}

export class A2uiMessageProcessor {
  // ...

  getClientCapabilities(options: ClientCapabilitiesOptions = {}): any {
    const inlineCatalogsDef = (options.inlineCatalogs || []).map(catalog => {
      const componentsSchema: Record<string, any> = {};
      
      for (const [name, comp] of catalog.components) {
        // 1. Convert Zod -> JSON Schema
        const rawJsonSchema = zodToJsonSchema(comp.schema, { 
            // Strategy to map tagged Zod types to "$ref": "common_types.json..."
            target: 'jsonSchema2019-09',
            definitions: {
                // If we defined common definitions here, we could use standard $ref generation.
                // However, we need external refs. Zod-to-json-schema doesn't natively support 
                // external $ref substitution easily via configuration. 
                //
                // We will implement a post-processing step or a custom Zod effect/metadata reader.
                // Since we use `.describe('REF:...')`, we can traverse the generated JSON schema,
                // find any node with description starting with 'REF:', and replace that node 
                // with { "$ref": "..." }.
            }
        });
        
        // Post-process to resolve references
        const resolvedSchema = this.resolveCommonTypeRefs(rawJsonSchema);

        // 2. Wrap in A2UI Component Envelope
        componentsSchema[name] = this.wrapComponentSchema(name, resolvedSchema);
      }

      return {
        catalogId: catalog.id,
        components: componentsSchema,
        // functions: ... (if applicable)
        // theme: ... (if applicable)
      };
    });

    return {
      supportedCatalogIds: this.catalogs.map(c => c.id),
      inlineCatalogs: inlineCatalogsDef.length > 0 ? inlineCatalogsDef : undefined
    };
  }

  private resolveCommonTypeRefs(schema: any): any {
    // Recursively traverse the schema object.
    // If a node has `description` starting with `REF:`, replace the entire node with { $ref: ... }
    if (typeof schema !== 'object' || schema === null) return schema;

    if (schema.description && schema.description.startsWith('REF:')) {
      const ref = schema.description.substring(4);
      return { $ref: ref };
    }

    if (Array.isArray(schema)) {
      return schema.map(item => this.resolveCommonTypeRefs(item));
    }

    const result: any = {};
    for (const key in schema) {
      result[key] = this.resolveCommonTypeRefs(schema[key]);
    }
    return result;
  }

  private wrapComponentSchema(name: string, propsSchema: any): any {
    // Logic to construct the { allOf: [ComponentCommon, ...], properties: { component: {const: name} } } structure
    // merging properties from propsSchema
    return {
       type: "object",
       allOf: [
         { "$ref": "common_types.json#/$defs/ComponentCommon" },
         // Note: We used to include { "$ref": "#/$defs/CatalogComponentCommon" } here for shared props like 'weight'.
         // However, for inlineCatalogs, we are explicitly adding 'weight' to every component schema.
         // A future optimization could be to detect shared properties duplicated across all components
         // and extract them into a common definition here.
         {
           type: "object",
           properties: {
             component: { const: name },
             ...propsSchema.properties
           },
           required: ["component", ...(propsSchema.required || [])]
         }
       ],
       unevaluatedProperties: false
    };
  }
}
```

## Example Component Definition

Here is how a Standard Catalog component would be defined using the new approach. Note how `weight` is included via a shared helper from the catalog package, while `accessibility` is omitted because it is handled by the Core framework.

**File:** `renderers/web_core/src/v0_9/standard_catalog/components/button.ts`

```typescript
import { z } from 'zod';
import { Component } from '../../catalog/types.js';
import { CommonTypes } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js'; // Shared catalog types

const buttonSchema = z.object({
  child: CommonTypes.ComponentId.describe('The ID of the child component...'),
  variant: z.enum(['primary', 'borderless']).optional().describe('A hint for the button style...'),
  action: CommonTypes.Action,
  enabled: z.boolean().optional().default(true), // Maps to checks/logic in full spec, simplified here
  
  // Catalog-specific common property
  weight: CatalogCommon.Weight.optional()
});

export class ButtonComponent<T> implements Component<T> {
  readonly name = 'Button';
  readonly schema = buttonSchema;

  constructor(private readonly renderer: (props: any) => T) {}

  render(context: ComponentContext<T>): T {
    // context.properties contains 'weight'
    // context.accessibility is available separately
    
    // ... existing render logic
  }
}
```

## Addressing Open Questions

### Is Zod fit for purpose?
Yes. Zod provides a robust TypeScript-first way to define schemas.
*   **Validation:** It handles runtime validation out-of-the-box.
*   **Generation:** The `zod-to-json-schema` library allows converting these definitions to JSON Schema.
*   **Refs:** To generate schemas that match `standard_catalog.json` (using `$ref` for common types), we will use a convention (like the `withRef` helper above) where specific Zod instances are tagged. The generation logic in `A2uiMessageProcessor` will intercept these tags and output the correct `$ref` string instead of expanding the schema inline.

### Where should schema validation happen?
Validation should be centralized in the **Core Framework**, specifically within `ComponentContext` or `SurfaceContext`.
*   **Why:** This prevents every renderer (Lit, Angular, etc.) from reimplementing validation logic.
*   **When:** Validation should ideally occur **during rendering** (lazy validation). This allows the `updateComponents` message to be processed quickly even if some components are temporarily invalid or incomplete (progressive rendering). When `render()` is called for a specific component, `ComponentContext` can check the properties against `component.schema`.
*   **Handling Failures:** If validation fails, the component can choose to render a fallback (e.g., an "Error" widget) or log a warning, rather than breaking the entire surface.

## Implementation Plan

1.  **Dependencies:** Add `zod` and `zod-to-json-schema` to `@a2ui/web_core` dependencies.
2.  **Common Schemas:** Create `schema_types.ts` in `web_core` with Zod definitions for `common_types.json` primitives (`DynamicString`, `Action`, etc.), utilizing a tagging mechanism for `$ref` generation.
3.  **Interface Update:** Update `Component` interface in `types.ts`.
4.  **Standard Catalog Update:** Iterate through all standard components (`Button`, `Text`, etc.) and define their `schema` properties using Zod and the common types.
5.  **Capability Generator:** Implement the `clientCapabilities` getter in `A2uiMessageProcessor`, including the logic to transform Zod schemas to JSON schemas with correct references.
6.  **Validation:** Add `validate()` method to `ComponentContext` and integrate calls (optional or mandatory) in component implementations.
