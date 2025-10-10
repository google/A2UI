# A2UI Repository Structure and Specification Guide

This document explains the structure of the A2UI repository, focusing on how the different specification files for the A2UI protocol relate to each other. The goal is to provide a clear roadmap for understanding and modifying the latest specification.

## Core Concepts

The A2UI protocol is designed as a flexible, streaming UI language. The current architecture modularizes the protocol into a generic core and extensible "catalogs" of components.

-   **Protocol**: Defines the fundamental message structure for server-to-client UI updates and client-to-server events.
-   **Catalog**: Defines a specific set of UI components (e.g., `Row`, `Text`, `Card`) and their properties. This makes the protocol independent of any particular UI widget set.

## File Breakdown

The repository is organized into high-level documentation and formal JSON schema specifications.

### 1. High-Level Documentation

These Markdown files describe the "why" and "how" of the protocol in a human-readable format.

-   **`docs/a2ui_protocol.md`**: The foundational specification document. It details the design philosophy, architecture, data flow, and core concepts. This is the best place to start to understand the protocol's fundamental goals.

-   **`docs/proposals/`**: This directory contains proposals for major versions of the A2UI protocol. Each proposal outlines the motivations and designs for significant updates. The latest proposal (e.g., `docs/proposals/v0_8.md`) should be considered the most current specification.

### 2. Formal JSON Schemas

These files are located in `specification/json/` and provide the machine-readable, formal definitions for the protocol.

#### Core Protocol Schemas (Generic)

These schemas define the fundamental structure of the A2UI protocol, but they are intentionally generic and do not contain specific UI components.

-   **`specification/json/protocol_schema.json`**: Defines the server-to-client message structure. This is the catalog-agnostic schema for messages like `surfaceUpdate`, `dataModelUpdate`, etc. `componentProperties` is an empty `object` here, as the specific components are defined by a catalog.

-   **`specification/json/client_event_schema.json`**: Defines the client-to-server event structure for messages like `userAction`, `clientUiCapabilities`, and `error`.

#### Catalog Schemas (Extensibility)

The catalog is the key to the protocol's extensibility.

-   **`specification/json/catalog_description_schema.json`**: This is a *meta-schema*. It defines the structure that a component catalog must follow.

-   **`specification/json/standard_catalog_description.json`**: This file is an *instance* of the catalog schema. It defines the standard, baseline set of components that all A2UI clients and servers can support for maximum compatibility.

#### The LLM Schema (Concrete & Specific)

An LLM needs a very strict and detailed schema to generate valid UI. This is created by combining the generic protocol schema with a specific catalog.

-   **`specification/json/standard_catalog_description_llm.json`**: This is a crucial example file. It represents the result of merging the generic `protocol_schema.json` with the `standard_catalog_description.json`. This is the type of concrete, specific schema that would be provided to an LLM to generate UI.

## How the Pieces Fit Together: A Specification Workflow

1.  **Foundation**: `docs/a2ui_protocol.md` provides the core principles.
2.  **Evolution**: The latest proposal in `docs/proposals/` (e.g., `v0_8.md`) explains the most current architecture.
3.  **Generic Contract**: `protocol_schema.json` defines the unchanging, generic structure of server-to-client communication.
4.  **Component Library**: A catalog file (like `standard_catalog_description.json`), which conforms to `catalog_description_schema.json`, defines the available UI widgets.
5.  **LLM-Ready Schema**: A server-side process takes the generic `protocol_schema.json` and injects the components from a specific catalog into it. The result is a concrete schema like `standard_catalog_description_llm.json`, which is then used to instruct the LLM.

### How to Update the Specification

To modify the standard specification, you will likely need to update multiple files in sync.

-   **To add a new standard component (e.g., a `Spinner`)**:
    1.  Update `specification/json/standard_catalog_description.json` to define the `Spinner` component and its properties.
    2.  Update the example `specification/json/standard_catalog_description_llm.json` to include the new `Spinner` definition within `componentProperties`.
    3.  Update the relevant documentation (e.g., `docs/a2ui_protocol.md` or the latest proposal in `docs/proposals/`) to reflect the new component.

-   **To change a core protocol feature (e.g., add a new message type)**:
    1.  Update the generic `protocol_schema.json` with the new message definition.
    2.  Update the concrete `standard_catalog_description_llm.json` to also include this new message.
    3.  Update the high-level documentation in `docs/a2ui_protocol.md` and the latest proposal in `docs/proposals/` to explain the new feature.
