# A2UI over Model Context Protocol (MCP)

This guide explains how to use **A2UI** declarative UI syntax to build rich, interactive interfaces delivered through **Model Context Protocol (MCP)** servers. By the end, you'll understand how to negotiate A2UI support, return UI payloads from MCP tools, and handle user interactions.

> **New to A2UI?** A2UI (Agent-to-UI) is a protocol that lets AI agents send structured UI descriptions (as JSON) to clients, which render them as native components. Instead of returning plain text, your agent can return buttons, cards, forms, and more. See the [A2UI specification](../../specification/) for the full schema.

## Prerequisites

- **Python 3.10+** with [uv](https://docs.astral.sh/uv/) (recommended) or pip
- **Node.js 18+** (for running client samples)
- Familiarity with [MCP](https://modelcontextprotocol.io/) concepts (servers, tools, resources)
- The [`mcp`](https://pypi.org/project/mcp/) Python package

## Quick Start: Run the Sample

The fastest way to see A2UI over MCP in action is to run the included recipe demo:

```bash
cd samples/agent/mcp/a2ui-over-mcp-recipe
uv run .
```

This starts an MCP server (SSE transport on port 8000) that exposes a `get_recipe_a2ui` tool returning a recipe card UI.

> **Note:** The recipe sample currently uses the v0.8 A2UI schema format (`beginRendering`/`surfaceUpdate`). The examples in this guide use the latest v0.10 format (`createSurface`/`updateComponents`). See the [specification directory](../../specification/) for schema details.

## Catalog Negotiation

Before a server can send A2UI to a client, they must establish mutual support for the protocol and determine which catalogs (component libraries) are available. This can happen in two ways:

### Option A: During MCP Initialization (Recommended)

MCP is a stateful session protocol, so the most efficient approach is to declare A2UI capabilities once during the `initialize` handshake. The client declares support under the `capabilities` object:

```json
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "id": "init-123",
  "params": {
    "protocolVersion": "2025-11-25",
    "clientInfo": {
      "name": "a2ui-enabled-client",
      "version": "1.0.0"
    },
    "capabilities": {
      "a2ui": {
        "clientCapabilities": {
          "v0.10": {
            "supportedCatalogIds": [
              "https://a2ui.org/specification/v0_10/basic_catalog.json"
            ]
          }
        }
      }
    }
  }
}
```

The server stores the client's A2UI capabilities for the duration of the session and uses them to decide which catalog and version to use when constructing UI responses.

### Option B: Per-Message Metadata (For Stateless Servers)

If your server is stateless, the client can pass A2UI capabilities in the `_meta` field of every tool call:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": "id-123",
  "params": {
    "name": "generate_report",
    "arguments": { "date": "2026-03-01" },
    "_meta": {
      "a2ui": {
        "clientCapabilities": {
          "v0.10": {
            "supportedCatalogIds": [
              "https://a2ui.org/specification/v0_10/basic_catalog.json"
            ],
            "inlineCatalogs": []
          }
        }
      }
    }
  }
}
```

## Returning A2UI Content as Embedded Resources

MCP tools return A2UI payloads as **Embedded Resources** — the UI layout is included directly in the tool response without requiring server-side storage.

Key fields:
- **URI**: Must use the `a2ui://` prefix with a descriptive identifier (e.g., `a2ui://training-plan-page`)
- **MIME Type**: Must be `application/json+a2ui` so the client routes the payload to the A2UI renderer instead of displaying raw JSON

### Python Example

```python
import json
import mcp.types as types

@self.tool()
def get_hello_world_ui():
    """Returns a simple A2UI Hello World interface."""
    a2ui_payload = [
        {
            "version": "v0.10",
            "createSurface": {
                "surfaceId": "default",
                "catalogId": "https://a2ui.org/specification/v0_10/basic_catalog.json"
            }
        },
        {
            "version": "v0.10",
            "updateComponents": {
                "surfaceId": "default",
                "components": [
                    {
                        "id": "root",
                        "component": {
                            "Text": {
                                "text": { "literalString": "Hello World!" }
                            }
                        }
                    }
                ]
            }
        }
    ]

    # Wrap A2UI as an Embedded Resource
    a2ui_resource = types.EmbeddedResource(
        type="resource",
        resource=types.TextResourceContents(
            uri="a2ui://hello-world",
            mimeType="application/json+a2ui",
            text=json.dumps(a2ui_payload),
        )
    )

    text_content = types.TextContent(
        type="text",
        text="Here is your Hello World UI!"
    )

    return types.CallToolResult(content=[text_content, a2ui_resource])
```

> **Tip:** The A2UI payload is a JSON **array** of messages. The first message creates the surface, and subsequent messages update components or data. You can also include `updateDataModel` messages to populate dynamic values.

## Handling User Actions

Interactive components (such as `Button`) can trigger actions that are sent back to the server as MCP tool calls.

### 1. Define a Button with an Action

In your A2UI component tree, attach an `action` to a button:

```json
{
  "id": "confirm-button",
  "component": {
    "Button": {
      "child": "confirm-button-text",
      "action": {
        "event": {
          "name": "confirm_booking",
          "context": {
            "start": "/dates/start",
            "end": "/dates/end"
          }
        }
      }
    }
  }
}
```

The `context` values starting with `/` are **data model paths**. When the user clicks the button, the client resolves these paths against the surface's data model and includes the resolved values in the tool call.

### 2. Client Sends an MCP Tool Call

When the button is clicked, the client translates the action into a standard MCP tool call:

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": "id-456",
  "params": {
    "name": "action",
    "arguments": {
      "name": "confirm_booking",
      "context": {
        "start": "2026-03-20",
        "end": "2026-03-25"
      }
    }
  }
}
```

### 3. Handle the Action on the Server

Register an `action` tool on your MCP server to receive these events:

```python
@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "action":
        action_name = arguments["name"]
        context = arguments.get("context", {})

        if action_name == "confirm_booking":
            start = context["start"]
            end = context["end"]
            return [types.TextContent(
                type="text",
                text=f"Booking confirmed from {start} to {end}."
            )]

        raise ValueError(f"Unknown action: {action_name}")
```

> **Note:** The sample code in [`samples/agent/mcp/a2ui-over-mcp-recipe/`](../../samples/agent/mcp/a2ui-over-mcp-recipe/) uses the low-level `Server` API with `@app.call_tool()`. The `@self.tool()` decorator shown in some examples is from the higher-level FastMCP API. Both approaches work.

## Error Handling

The client can report errors back to the server when it fails to process an A2UI payload.

### Error Payload

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "id": "id-789",
  "params": {
    "name": "error",
    "arguments": {
      "code": "INVALID_JSON",
      "message": "Failed to parse A2UI payload.",
      "surfaceId": "default"
    }
  }
}
```

### Error Handler

```python
@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "error":
        code = arguments.get("code", "UNKNOWN")
        message = arguments.get("message", "")
        surface_id = arguments.get("surfaceId", "")
        # Log or handle the error
        return [types.TextContent(
            type="text",
            text=f"Received error {code} on surface {surface_id}: {message}"
        )]
```

## Verbalization and Visibility Control

Control whether the LLM can "see" A2UI payloads using MCP **Resource Annotations**:

```python
a2ui_resource = types.EmbeddedResource(
    type="resource",
    resource=types.TextResourceContents(
        uri="a2ui://training-plan-page",
        mimeType="application/json+a2ui",
        text=json.dumps(a2ui_payload)
    ),
    # Show the rendered UI to the user, but hide the raw JSON from the LLM
    annotations=types.Annotations(audience=["user"])
)
```

| Audience | Behavior |
|----------|----------|
| *(empty/unset)* | Visible to both user and LLM |
| `["user"]` | Rendered for the user; hidden from the LLM |
| `["assistant"]` | Available to the LLM for context; not rendered as UI |

## Related Guides

- [MCP Apps in A2UI Surfaces](mcp-apps-in-a2ui-surface.md) — how to embed full HTML applications (from MCP servers) securely within A2UI surfaces using iframe isolation
- [Authoring Components](authoring-components.md) — creating custom A2UI components
- [Client Setup](client-setup.md) — setting up an A2UI client application

## Samples

| Sample | Description | Path |
|--------|-------------|------|
| Recipe Card (MCP) | A2UI recipe card served over MCP SSE | [`samples/agent/mcp/a2ui-over-mcp-recipe/`](../../samples/agent/mcp/a2ui-over-mcp-recipe/) |
| Calculator (MCP Apps) | HTML calculator app via MCP with iframe isolation | [`samples/agent/mcp/mcp-apps-calculator/`](../../samples/agent/mcp/mcp-apps-calculator/) |
