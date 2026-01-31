# A2UI Agent Go SDK

This directory contains the Go implementation of the A2UI agent library,
enabling agents to "speak UI" using the A2UI protocol.

## Overview

The `a2ui` package provides the core infrastructure for an agent to:

1. **Declare Capability**: Signal support for the A2UI extension (
   `https://a2ui.org/a2a-extension/a2ui/v0.8`).
2. **Validate Payloads**: Ensure generated A2UI JSON conforms to the required
   schema before sending.
3. **Transport UI**: Encapsulate A2UI payloads within A2A `DataPart`s for
   transport to the client.

## Components

The SDK mirrors the structure of the reference Python implementation:

* **`a2ui.go`**: Core constants (`ExtensionURI`, MIME types), types, and helper
  functions for extension management (`GetA2UIAgentExtension`,
  `TryActivateA2UIExtension`) and A2UI part manipulation (`CreateA2UIPart`,
  `IsA2UIPart`, `GetA2UIDataPart`).
* **`schema.go`**: Utilities for A2UI schema manipulation, specifically wrapping
  the schema in a JSON array to support streaming lists of components.
* **`toolset.go`**:
    * **`SendA2UIToClientToolset`**: Manages the A2UI toolset lifecycle.
    * **`SendA2UIJsonToClientTool`**: A tool exposed to the LLM that validates
      generated JSON against the provided schema using
      `github.com/santhosh-tekuri/jsonschema/v5` and prepares it for sending.
    * **`ConvertSendA2UIToClientGenAIPartToA2APart`**: A helper to convert LLM
      tool responses into A2A `Part`s.

## Dependencies

* **A2A Protocol**: Uses the [A2A Go SDK](https://github.com/a2aproject/a2a-go)
  for core definitions (`Part`, `DataPart`, `AgentExtension`, etc.).
* **JSON Schema Validation**: Uses `github.com/santhosh-tekuri/jsonschema/v5`
  for robust runtime validation of agent-generated UI.

## Usage

### Initializing the Toolset

```go
import (
"github.com/google/A2UI/a2a_agents/go/a2ui"
// ... other imports
)

// Define a provider for your A2UI schema (e.g., loaded from a file)
schemaProvider := func (ctx context.Context) (map[string]interface{}, error) {
return loadMySchema(), nil
}

// Check if A2UI should be enabled for this request
enabledProvider := func (ctx context.Context) (bool, error) {
// Logic to check if the client supports A2UI (e.g., checking requested extensions)
return a2ui.TryActivateA2UIExtension(ctx), nil
}

// Create the toolset
toolset := a2ui.NewSendA2UIToClientToolset(
a2ui.A2UIEnabledProvider(enabledProvider),
a2ui.A2UISchemaProvider(schemaProvider),
)

// Get the tools to register with your LLM agent
tools, err := toolset.GetTools(ctx)
if err != nil {
// handle error
}
```

## Building the SDK

To build the SDK, run the following command from the `a2a_agents/go` directory:

```bash
go build ./a2ui
```

This will compile the `a2ui` package and report any syntax or dependency errors.
Since this is a library, it will not produce an executable binary.

## Running Tests

To run the test suite from the `a2a_agents/go` directory:

```bash
go test -v ./a2ui
```

## Disclaimer

Important: The sample code provided is for demonstration purposes and
illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When
building production applications, it is critical to treat any agent operating
outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard,
messages, artifacts, and task statuses—should be handled as untrusted input. For
example, a malicious agent could provide crafted data in its fields (e.g., name,
skills.description) that, if used without sanitization to construct prompts for
a Large Language Model (LLM), could expose your application to prompt injection
attacks.

Similarly, any UI definition or data stream received must be treated as
untrusted. Malicious agents could attempt to spoof legitimate interfaces to
deceive users (phishing), inject malicious scripts via property values (XSS), or
generate excessive layout complexity to degrade client performance (DoS). If
your application supports optional embedded content (such as iframes or web
views), additional care must be taken to prevent exposure to malicious external
sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox
rendered content can introduce severe vulnerabilities. Developers are
responsible for implementing appropriate security measures—such as input
sanitization, Content Security Policies (CSP), strict isolation for optional
embedded content, and secure credential handling—to protect their systems and
users.
