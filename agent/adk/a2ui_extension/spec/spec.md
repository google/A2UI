# A2UI (Agent-to-Agent UI) Extension Spec

## Overview

This extension implements the A2UI (Agent-to-Agent UI) spec, a format for agents to send streaming, interactive user interfaces to clients.

## Extension URI

The URI of this extension is https://raw.githubusercontent.com/google/A2UI/refs/heads/main/a2a_samples/a2ui_extension/spec/spec.md

This is the only URI accepted for this extension.

## Core Concepts

The A2UI extension is built on three main concepts:

Surfaces: A "Surface" is a distinct, controllable region of the client's UI. The spec uses a surfaceId to direct updates to specific surfaces (e.g., a main content area, a side panel, or a new chat bubble). This allows a single agent stream to manage multiple UI areas independently.

Catalog Definition Document: The a2ui extension is component-agnostic. All UI components (e.g., Text, Row, Button) and their stylings are defined in a separate Catalog Definition Schema. This allows clients and servers to negotiate which catalog to use.

Schemas: The a2ui extension is defined by three primary JSON schemas:

Catalog Definition Schema: A standard format for defining a library of components and styles.

Server-to-Client Message Schema: The core wire format for messages sent from the agent to the client (e.g., surfaceUpdate, dataModelUpdate).

Client-to-Server Event Schema: The core wire format for messages sent from the client to the agent (e.g., userAction, clientUiCapabilities).

Agent Capability Declaration
Agents advertise their A2UI capabilities in their AgentCard within the AgentCapabilities.extensions list. The params object defines the agent's specific UI support, including which component catalogs it can generate and whether it accepts dynamic catalogs from the client.

Example AgentExtension block:

Parameter Definitions
params.supportedSchemas: (REQUIRED) An array of strings, where each string is a URI pointing to a component Catalog Definition Schema that the agent can generate. This could include the default catalog or custom catalogs or both.

params.acceptsDynamicSchemas: (OPTIONAL) A boolean indicating if the agent can accept a clientUiCapabilities message containing a dynamicCatalog. If omitted, this defaults to false.

Client Capability Declaration
The client-to-server spec includes a clientUiCapabilities message. If a client wishes to use a specific catalog (other than the server's default) or provide its own dynamic catalog, it MUST send this message after the connection is established and before the first user prompt.

This message allows the client to specify either:

A catalogUri: A URI for a known, shared catalog (which must be one of the supportedSchemas from the agent).

A dynamicCatalog: An inline Catalog Definition Schema object. This is only allowed if the agent's acceptsDynamicSchemas capability is true.

Extension Activation
Clients indicate their desire to use the A2UI extension by specifying it via the transport-defined A2A extension activation mechanism.

For JSON-RPC and HTTP transports, this is indicated via the X-A2A-Extensions HTTP header.

For gRPC, this is indicated via the X-A2A-Extensions metadata value.

Activating this extension implies that the server can send A2UI-specific messages (like surfaceUpdate) and the client is expected to send A2UI-specific events (like userAction).
