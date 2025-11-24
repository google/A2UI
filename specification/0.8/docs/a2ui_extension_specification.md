# A2UI (Agent to UI) Extension Specification

## Overview

This document specifies the A2UI extension for the Agent-to-Agent (A2A) protocol. This extension allows agents to send streaming, interactive user interfaces to clients that can render them.

## Extension URI

The URI for this version of the extension is: `https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/0.8/docs/a2ui_extension_specification.md`

## Core Concepts

The A2UI extension is built on three main concepts:

-   **Surfaces**: A "Surface" is a distinct, controllable region of the client's UI. The protocol uses a `surfaceId` to direct updates to specific surfaces (e.g., a main content area, a side panel, or a new chat bubble). This allows a single agent stream to manage multiple UI areas independently.

-   **Catalog**: The A2UI extension is component-agnostic. All UI components (e.g., `Text`, `Row`, `Button`) and their properties are defined in a separate **Catalog**. This allows clients and servers to negotiate which set of components to use for rendering a UI.

-   **Schemas**: The A2UI protocol is formally defined by a set of JSON schemas, which describe the structure of catalogs, server-to-client messages, and client-to-server event payloads.

## Agent Capability Declaration

An agent advertises its ability to serve A2UI content by including an extension object in its A2A Agent Card. The `params` object within this extension defines the agent's specific UI generation capabilities.

### Extension Parameters (`params`)

-   `supportedCatalogUris` (array of strings, required): A list of URIs that identify the component catalogs the agent can generate. These URIs are stable identifiers and should not be fetched at runtime.
-   `acceptsInlineCatalog` (boolean, required): A flag indicating whether the agent can accept a complete, inline catalog definition from the client.

**Example Agent Card Snippet:**

```json
{
  "name": "My A2UI Agent",
  "capabilities": {
    "extensions": [
      {
        "uri": "https://raw.githubusercontent.com/google/A2UI/refs/heads/main/specification/0.8/docs/a2ui_extension_specification.md",
        "description": "Provides interactive UIs via the A2UI protocol.",
        "required": false,
        "params": {
          "supportedCatalogUris": [
            "https://a2ui.org/catalogs/standard/0.8",
            "https://my-company.com/a2ui/catalogs/custom/1.2"
          ],
          "acceptsInlineCatalog": true
        }
      }
    ]
  }
}
```

## Client Catalog Selection

The A2UI protocol is **stateless** regarding catalog selection. The client **must** inform the server which catalog to use in **every** A2A `Message` it sends. This is done by including an `a2uiClientCapabilities` object in the `metadata` field of the A2A `Message`.

This object must contain exactly one of the following properties:

1.  `catalogUri` (string): The URI of a catalog that the server has advertised in its `supportedCatalogUris` list.
2.  `inlineCatalog` (object): A complete, inline catalog definition. This is only permitted if the agent's `acceptsInlineCatalog` capability is `true`. An inline catalog **replaces** the standard catalog; it is not additive.

**Example A2A Message with Client Capabilities:**

```json
{
  "messageId": "msg-123",
  "metadata": {
    "a2uiClientCapabilities": {
      "catalogUri": "https://a2ui.org/catalogs/standard/0.8"
    }
  },
  "parts": [
    {
      "data": {
        "data": {
          "userAction": {
            "name": "find_restaurants",
            "surfaceId": "s1",
            "sourceComponentId": "c1",
            "timestamp": "2025-11-24T09:59:58Z",
            "context": {
              "location": "Mountain View, CA"
            }
          }
        }
      }
    }
  ]
}
```

## Extension Activation

Clients indicate their desire to use the A2UI extension by specifying its URI via the transport-defined A2A extension activation mechanism (e.g., the `X-A2A-Extensions` HTTP header).

Activating this extension implies that the server can send A2UI-specific messages (like `surfaceUpdate`) in its response stream and the client is expected to send A2UI-specific event payloads (like `userAction`) in its requests.
