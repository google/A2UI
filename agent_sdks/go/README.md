# A2UI Go Agent SDK

The `agent_sdks/go` directory contains the Go implementation of
the A2UI agent SDK.

## Core Components

### Package `a2ui` (root)

* **`a2ui.go`**: Package entry point. Defines `Version`, `SystemPromptOptions`,
  and the `InferenceStrategy` interface for generating LLM system prompts.

### Schema Management (`schema/`)

* **`manager.go`**: The `A2uiSchemaManager` handles loading specification
  schemas, managing catalogs, and generating system prompts for LLMs.
* **`validator.go`**: Implements `A2uiValidator` for validating A2UI messages
  against JSON schemas and protocol rules (topology, reachability, circular
  references, recursion depth).
* **`catalog.go`**: Defines `A2uiCatalog` and `CatalogConfig` for handling
  component libraries.
* **`catalog_provider.go`**: Provides `A2uiCatalogProvider` interface with
  `FileSystemCatalogProvider` and `RawCatalogProvider` implementations.
* **`common_modifiers.go`**: Schema modifier utilities for pruning and
  customizing component schemas.
* **`assets.go`**: Bundled JSON schema resources (embedded via `go:embed`).
* **`utils.go`**: Shared utility functions for topology analysis and ref field
  extraction.

### Parser (`parser/`)

* **`parser.go`**: Implementation of `ParseResponse` for synchronous parsing of
  complete LLM responses.
* **`streaming.go`**: `A2uiStreamParser` for incremental streaming parsing with
  automatic JSON healing, component-level yielding, and validation.
* **`streaming_v09.go`**: v0.9-specific streaming parser logic
  (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`).
* **`payload_fixer.go`**: Utilities to automatically correct common LLM output
  issues in A2UI payloads (trailing commas, unquoted keys, etc.).
* **`response_part.go`**: Defines the `ResponsePart` struct representing parsed
  output (text + A2UI JSON).

### Basic Catalog (`basiccatalog/`)

* **`basiccatalog.go`**: Implementation of `BundledCatalogProvider` for the
  standard A2UI basic catalog (Button, Text, Row, Column, etc.).

## Running Tests

1. Navigate to the directory:

   ```bash
   cd agent_sdks/go
   ```

2. Run all tests:

   ```bash
   go test ./...
   ```
 