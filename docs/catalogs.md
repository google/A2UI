# A2UI Catalogs

## Overview

This guide defines the A2UI Catalog architecture and provides a roadmap for implementation. It explains the structure of catalog schemas, outlines strategies for using the pre-built "Basic Catalog” versus defining your own application-specific catalog, and details the technical protocols for catalog negotiation, versioning, and runtime validation.

## Catalog Definition

A catalog is a [JSON Schema file](../specification/v0_9/json/a2ui_client_capabilities.json#L62C5-L95C6) outlining the components, functions, and themes that agents can use to define A2UI surfaces using server-driven UI. All A2UI JSON sent from the agent is validated against the chosen catalog.

[Catalog JSON Schema](../specification/v0_9/json/a2ui_client_capabilities.json#L62C5-L95C6) is below

```json
{
  "Catalog": {
    "type": "object",
    "description": "A collection of component and function definitions.",
    "properties": {
      "catalogId": {
        "type": "string",
        "description": "Unique identifier for this catalog."
      },
      "components": {
        "type": "object",
        "description": "Definitions for UI components supported by this catalog.",
        "additionalProperties": {
          "$ref": "https://json-schema.org/draft/2020-12/schema"
        }
      },
      "functions": {
        "type": "array",
        "description": "Definitions for functions supported by this catalog.",
        "items": {
          "$ref": "#/$defs/FunctionDefinition"
        }
      },
      "theme": {
        "title": "A2UI Theme",
        "description": "A schema that defines a catalog of A2UI theme properties.",
        "type": "object",
        "additionalProperties": {
          "$ref": "https://json-schema.org/draft/2020-12/schema"
        }
      }
    },
    "required": [
      "catalogId"
    ],
    "additionalProperties": false
  }
}
```

## Catalog Strategy

Every A2UI surface is driven by a Catalog. A catalog is simply a JSON Schema file that tells the agent which components, functions, and themes are available for it to use.

Whether you are building a simple prototype or a complex production application, the requirement is the same: you must provide a catalog definition that the agent uses to express UI.

### The Basic Catalog

To help developers get started quickly, the A2UI team maintains the [Basic Catalog](../specification/v0_9/json/standard_catalog.json).

This is a pre-defined catalog file that contains a standard set of general-purpose components (Buttons, Inputs, Cards) and functions. It is not a special "type" of catalog; it is simply a version of a catalog that we have already written and have open source renderers for. 

The basic catalog allows you to bootstrap an application or validate A2UI concepts without needing to write your own schema from scratch. It is intentionally sparse to remain easily implementable by different renderers.

Since A2UI is designed for LLMs to generate the UI at either design time or runtime, we do not think portability requires a standardized catalog across multiple clients; the LLM can interpret the catalog for each individual frontend.

[See the A2UI v0.9 basic catalog](../specification/v0_9/json/standard_catalog.json)

### Defining Your Own Catalog

While the Basic Catalog is useful for starting out, most production applications will define their own catalog to reflect their specific design system.

By defining your own catalog, you restrict the agent to using exactly the components and visual language that exist in your application, rather than generic inputs or buttons. This catalog can be built entirely from scratch, or it can import definitions from the Basic Catalog to save time (e.g., using the Basic text definitions while defining your own unique Card component).

For simplicity we recommend building catalogs that directly reflect a client's design system rather than trying to map the Basic Catalog to it through an adapter. Since A2UI is designed for GenUI, we expect the LLM can interpret different catalogs for different clients.

[See an example Rizzcharts catalog](../samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json)

### Recommendations

| Usecase | Recommendation | Effort |
| :--- | :--- | :--- |
| Adding A2UI to a mature frontend | Define a catalog that mirrors your existing design system. | Medium |
| Adding A2UI to a new/greenfield app | Start with Basic Catalog, then evolve into your own catalog as the app evolves | Low (assuming renderer exists) |

## Building a Catalog

A catalog is a JSON Schema file that conforms to the [Catalog schema](../specification/v0_9/json/a2ui_client_capabilities.json#L62C5-L95C6) that defines the components, themes and functions an agent can use when building a surface.

### Example: A Minimal Catalog

Here is a simple catalog defining a single component.

```json
{
  "$id": "https://github.com/.../hello_world/v1/catalog.json",
  "components": {
    "HelloWorldBanner": {
      "type": "object",
      "description": "A simple banner greeting.",
      "properties": {
        "message": {
          "type": "string",
          "description": "The banner text."
        },
        "backgroundColor": {
          "type": "string",
          "default": "#f0f0f0"
        }
      },
      "required": [
        "message"
      ]
    }
  }
}
```

When the agent uses that catalog, it generates a payload strictly conforming to that structure:

```json
[
  {
    "createSurface": {
      "surfaceId": "hello-world-surface",
      "catalogId": "https://github.com/.../hello_world/v1/catalog.json",
      "root": "root-element"
    }
  },
  {
    "surfaceUpdate": {
      "surfaceId": "hello-world-surface",
      "components": [
        {
          "id": "root-element",
          "component": {
            "HelloWorldBanner": {
              "message": "Hello, world! Welcome to your first catalog.",
              "backgroundColor": "#4CAF50"
            }
          }
        }
      ]
    }
  }
]
```

### Freestanding Catalogs

A2UI Catalogs must be standalone (no references to external files) to simplify LLM inference and dependency management. 

While the final catalog must be freestanding, you may still author your catalogs modularly using JSON Schema `$ref` pointing to external documents during local development. Run  `scripts/build_catalog.py` before distributing your catalog to bundle all external file references into a single, independent JSON Schema file:

```bash
uv run scripts/build_catalog.py <path-to-your-catalog.json>
```

### Composition & Imports

You do not have to define everything from scratch. You can define a catalog which uses existing components from the basic or other catalogs, and one that reusing the existing rendering logic.

#### Example: Extending the Basic Catalog

This catalog imports all elements from the Basic Catalog and adds a new `SuggestionChips` component.

```json
{
  "$id": "https://github.com/.../hello_world_with_all_basic/v1/catalog.json",
  "components": {
    "allOf": [
      { "$ref": "standard_catalog_definition.json#/components" },
      {
        "SuggestionChips": {
          "type": "object",
          "description": "A list of suggested prompts",
          "properties": {
            "suggestions": {
              "type": "array",
              "description": "The suggested prompts."
            }
          },
          "required": [ "suggestions" ]
        }
      }
    ]
  }
}
```

**Make sure to run `scripts/build_catalog.py` to resolve the external $ref before publishing.**

#### Example: Cherry-picking Components

This catalog imports only `Text` and `Icon` from the Basic Catalog to build a simple Popup surface.

```json
{
  "$id": "https://github.com/.../hello_world_with_some_basic/v1/catalog.json",
  "components": {
    "allOf": [
      { "$ref": "standard_catalog_definition.json#/components/Text" },
      { "$ref": "standard_catalog_definition.json#/components/Icon" },
      {
        "Popup": { 
          "type": "object",
          "description": "A modal overlay that displays an icon and text.",
          "properties": {
            "text": { "$ref": "common_types.json#/$defs/ComponentId" },
            "icon": { "$ref": "common_types.json#/$defs/ComponentId" }
          },
          "required": [ "text", "icon" ]
        }
      }
    ]
  }
}
```

**Make sure to run `scripts/build_catalog.py` to resolve the external $ref before publishing.**

### Implementing Renderers

Client renderers implement the catalog by mapping the schema definition to actual code.

[Example Rizzcharts typescript renderer for the hello world catalog](../samples/client/angular/projects/rizzcharts/src/a2ui-catalog/catalog.ts).

```typescript
import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular'; 
import { inputBinding } from '@angular/core'; 

export const RIZZ_CHARTS_CATALOG = {   
  ...DEFAULT_CATALOG, // Include the basic catalog   
  HelloWorldBanner: {     
    type: () => import('./hello_world_banner').then((r) => r.HelloWorldBanner),     
    bindings: ({ properties }) => [       
      inputBinding('message', () => ('message' in properties && properties['message']) || undefined),       
      inputBinding('backgroundColor', () => ('backgroundColor' in properties && properties['backgroundColor']) || undefined),       
    ],   
  }, 
} as Catalog;
```

## A2UI Catalog Negotiation

Because clients and agents can support multiple catalogs, they must agree on which catalog to use through a catalog negotiation handshake.

### Step 1: Agent advertises its support catalogs (optional) 

The agent may optionally advertise which catalogs it is capable of speaking (e.g., in the A2A Agent Card). This is informational; it helps the client know if the agent supports their specific features, but the client doesn’t have to use it.

Example of an A2A AgentCard advertising that the agent supports the basic and rizzcharts catalogs

```json
{
  "name": "Ecommerce Dashboard Agent",
  "description": "This agent visualizes ecommerce data...",
  "capabilities": {
    "extensions": [
      {
        "uri": "https://a2ui.org/a2a-extension/a2ui/v0.8",
        "description": "Provides agent driven UI using the A2UI JSON format.",
        "params": {
          "supportedCatalogIds": [
            "https://a2ui.org/specification/v0_9/standard_catalog.json",
            "https://github.com/.../rizzcharts_catalog_definition.json"
          ]
        }
      }
    ]
  }
}
```

### Step 2: Client advertises its support catalogs (required)

The client sends a list of supportedCatalogIds to the Agent, ordered by preference, in the metadata of every message. This tells the agent exactly what the client is prepared to render right now.

Example of A2A message containing the supportedCatalogIds in metadata

```json
{
  "parts": [
    {
      "text": "What is the current status of my flight?"
    }
  ],
  "metadata": {
    "a2uiClientCapabilities": {
      "supportedCatalogIds": [
        "https://a2ui.org/specification/v0_9/standard_catalog.json",
        "https://github.com/.../rizzcharts_catalog_definition.json"
      ]
    }
  }
}
```

### Step 3: Agent Selection

When the agent creates a new surface, it selects the best match from the client's `supportedCatalogIds` list. This choice is locked for the lifetime of that surface. If no compatible catalog is found, the agent will not send a UI.

Example A2UI Message from the agent defining the catalog_id used in a surface

```json
{
  "createSurface": {
    "surfaceId": "salesDashboard",
    "catalogId": "https://a2ui.org/specification/v0_9/standard_catalog.json"
  }
}
```

## Catalog Naming & Versioning

A2UI component catalogs require versioning because catalog definitions are often built in at compile time, so any mismatch between what an agent generates and what a client can render will break the UI.

### CatalogId Naming Convention

The `catalogId` is a unique text identifier used for negotiation between the client and the agent.

* **Format:** While the `catalogId` is technically a string, the A2UI convention is to use a **URI** (e.g., `https://example.com/catalogs/mysurface/v1/catalog.json`).  
* **Purpose:** We use URIs to make the ID globally unique and easy for human developers to inspect in a browser.  
* **No Runtime Fetching:** This URI does not imply that the agent or client downloads the catalog at runtime. **The catalog definition must be known to the agent and client beforehand (at compile/deploy time)**. The URI serves only as a stable identifier.

### Versioning Guidelines

Unlike standard JSON parsers where extra data is safely ignored, A2UI requires strict versioning to prevent semantic errors. If a client silently drops a new component (like a new "Itinerary" component) because it doesn't recognize it, the user misses critical information. 

To ensure the agent only generates UI the client can fully render, any structural change—even purely additive ones—requires a new catalog version. This is enforced by the A2UI JSON Schema which generally does not allow for unrecognized properties.

* **Structural Changes (New Version Required)** Any change that alters the semantic meaning of the A2UI JSON payload requires a new catalog version. This ensures the Agent never sends a component the Client cannot render. A new catalog version is required for:
    * **Adding a new component:** (e.g., adding `FacePile` or `Itinerary`).
    * **Adding a new property:** Even if optional, if the Agent generates it, it expects it to be rendered. 
    * **Renaming/Removing fields:** These are standard breaking changes.

* **Metadata Changes (Same Version Allowed)** You may keep the same catalog version only if the change has no impact on the generated JSON structure or the renderer's behavior. You can keep the version when
    * Updating `description` fields (to help the LLM understand the component better).
    * Fixing typos in comments or documentation.

### Versioning with CatalogId

We recommend including the version in the catalogId. This allows using A2UI catalog negotiation to support multiple versions simultaneously during a migration, ensuring zero downtime.

**Recommended Pattern:**

| Change Type | URI Example | Description |
| :--- | :--- | :--- |
| **Current** | .../rizzcharts/v1/catalog.json | The stable, production schema. |
| **Breaking** | .../rizzcharts/v2/catalog.json | A new schema introducing renamed components or structural changes. |

### Handling Migrations

To upgrade a catalog without breaking active agents, use A2UI Catalog Negotiation:

1. **Client Update:** The client updates its list of supportedCatalogIds to include *both* the old and new versions (e.g., [".../v2/...", ".../v1/..."]).  
2. **Agent Update:** Agents are rebuilt with the v2 schema. When they see the client supports v2, they prefer it.  
3. **Legacy Support:** Older agents that have not yet been rebuilt will continue to match against v1 in the client's list, ensuring they remain functional.

## A2UI Schema Validation & Fallback 

To ensure a stable user experience, A2UI employs a two-phase validation strategy. This "defense in depth" approach catches errors as early as possible while ensuring clients remain robust when facing unexpected payloads.

### Two-Phase Validation

1. **Agent-Side (Pre-Send):** Before transmitting any UI payload, the agent runtime validates the generated JSON against the catalog definition.  
   * Purpose: To catch hallucinated properties or malformed structures at the source.  
   * Outcome: If validation fails, the agent can attempt to fix or regenerate the A2UI JSON, or it can do graceful degradation such as falling back to text in a conversational app.  
2. **Client-Side:** Upon receiving the payload, the client library validates the JSON against its local definition of the catalog.  
   * Purpose: Security and stability. This ensures that the code executing on the user's device strictly conforms to the expected contract, protecting against version mismatches or compromised agent outputs.  
   * Outcome: Failures here are reported back to the agent using the “error” client message

### Graceful Degradation

Even if a payload passes schema validation, the renderer may encounter runtime issues (e.g., a missing asset, a component implementation not yet loaded, or a platform-specific limitation).

Clients should not crash when encountering these errors. Instead, they should employ Graceful Degradation:

* **Unknown Components:** If a component is recognized in the schema but not implemented in the renderer, render a "safe" fallback (e.g., a generic card with the component's debug name) or skip rendering that specific node entirely.  
* **Text Fallback:** If the entire surface fails to render, display the raw text description (if available) or a generic error message: *"This interface could not be displayed."*

### Client-to-Server Error Reporting

When the client detects a validation error or a runtime failure, it can report this back to the agent. This allows the agent system to log the failure for developers or adjust its future behavior.

The client sends a `VALIDATION_FAILED` event using the standard A2UI Client-to-Server Event Schema.

Example of client reporting a missing required field

```json
{
  "version": "v0.9",
  "error": {
    "code": "VALIDATION_FAILED",
    "surfaceId": "flight-status-card-123",
    "path": "/components/FlightCard/flightNumber",
    "message": "Missing required property 'flightNumber' in component 'FlightCard'."
  }
}
```

## Inline Catalogs

Inline catalogs sent by the client at runtime are supported but not recommended in production. More details about them can be found [here](../specification/v0_9/docs/a2ui_protocol.md#client-capabilities--metadata).

