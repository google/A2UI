# A2UI over Model Context Protocol (MCP)

This guide shows you how to serve **rich, interactive A2UI interfaces** from an **MCP server** using Tools and Embedded Resources. By the end, you'll have a working MCP server that returns A2UI components to any MCP-compatible client.

<video width="100%" height="auto" controls playsinline style="display: block; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; margin-bottom: 24px;">
  <source src="https://raw.githubusercontent.com/google/A2UI/main/docs/assets/guides-a2ui-over-mcp-tour.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Prerequisites

Ensure you have the following installed before you begin:

- **Python** (version 3.10 or later).
- **[uv](https://docs.astral.sh/uv/)** for fast Python package management.
- **Node.js** (version 18 or later) for the MCP Inspector.

## Quick Start: Run the Sample

Before diving into the protocol details, let's get a working example running. The A2UI repo includes a ready-to-go MCP recipe demo.

```bash
# Clone the repo (if you haven't already)
git clone https://github.com/google/A2UI.git
cd A2UI/samples/agent/mcp/a2ui-over-mcp-recipe

# Start the MCP server (SSE transport on port 8000)
uv run .
```

In a separate terminal, launch the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) to interact with the server:

```bash
npx @modelcontextprotocol/inspector
```

In the Inspector:

1. Set **Transport Type** to `SSE`
2. Connect to `http://localhost:8000/sse`
3. Click **List Tools** → you'll see `get_recipe_a2ui`
4. Run the tool → the response contains A2UI JSON that renders a recipe card

> NOTE: Note
>
> The sample uses a local path reference to the A2UI Agent SDK. For your own projects, install from PyPI:
> ```bash
> pip install a2ui-agent-sdk
> ```

See all samples at [`samples/agent/mcp/`](https://github.com/google/A2UI/tree/main/samples/agent/mcp).

## How It Works

An MCP server returns A2UI content as **Embedded Resources** inside tool responses. The client detects the `application/json+a2ui` MIME type and routes the payload to an A2UI renderer.

```
Client → tools/call → MCP Server
                         ↓
              Generate A2UI JSON
                         ↓
         Wrap as EmbeddedResource
              (application/json+a2ui)
                         ↓
Client ← CallToolResult ← MCP Server
   ↓
A2UI Renderer displays UI
```

## Catalog Negotiation

Before a server can send A2UI to a client, they must establish which catalogs are available. Depending on your architecture, this can happen in one of two ways.

### Option A: During MCP Initialization (Recommended)

MCP is a stateful session protocol, so the most efficient approach is to declare capabilities once during connection setup. The client declares its A2UI support under `capabilities`:

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
          "v0.9": {
            "supportedCatalogIds": [
              "https://a2ui.org/specification/v0_9/basic_catalog.json"
            ]
          }
        }
      }
    }
  }
}
```

The server stores this state for the duration of the session.

### Option B: Per-Message Metadata (For Stateless Servers)

If your server must remain stateless, the client can pass A2UI capabilities in the `_meta` field of every tool call:

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
          "v0.9": {
            "supportedCatalogIds": [
              "https://a2ui.org/specification/v0_9/basic_catalog.json"
            ],
            "inlineCatalogs": []
          }
        }
      }
    }
  }
}
```

## Returning A2UI Content

A2UI content is returned as **Embedded Resources** inside a `CallToolResult`. Key rules:

- **URI**: Must use the `a2ui://` prefix with a descriptive name (e.g., `a2ui://training-plan-page`)
- **MIME Type**: Must be `application/json+a2ui` — this tells the client to route the payload to an A2UI renderer

### Python Example

```python
import json
import mcp.types as types

@self.tool()
def get_hello_world_ui():
    """Returns a simple A2UI hello world interface."""
    a2ui_payload = [
        {
            "version": "v0.9",
            "createSurface": {
                "surfaceId": "default",
                "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json"
            }
        },
        {
            "version": "v0.9",
            "updateComponents": {
                "surfaceId": "default",
                "components": [
                    {
                        "id": "root",
                        "component": "Text",
                        "text": "Hello World!"
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

    # Include a text summary alongside the UI
    text_content = types.TextContent(
        type="text",
        text="Here is a hello world UI."
    )

    return types.CallToolResult(content=[text_content, a2ui_resource])
```

> TIP: Tip
>
> Always include a `TextContent` alongside your A2UI resource. Clients that don't support A2UI will fall back to showing the text.

## Handling User Actions

Interactive components like `Button` can trigger actions that are sent back to the server as MCP tool calls.

### 1. Define a Button with an Action

In your A2UI JSON, add an `action` to a component:

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

### 2. Client Sends the Action as a Tool Call

When the user clicks the button, the client resolves data bindings (like `/dates/start`) against the surface state and sends a tool call:

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

```python
@self.tool()
async def action(name: str, context: dict) -> types.CallToolResult:
    """Handle A2UI user actions."""
    if name == "confirm_booking":
        # Process the booking, then return confirmation UI
        return types.CallToolResult(content=[
            types.TextContent(
                type="text",
                text=f"Booking confirmed: {context['start']} to {context['end']}"
            )
        ])
    raise ValueError(f"Unknown action: {name}")
```

## Error Handling

Clients can report A2UI rendering errors back to the server via a tool call:

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

Handle it on the server:

```python
@self.tool()
async def error(code: str, message: str, surfaceId: str = "") -> types.CallToolResult:
    """Handle A2UI client errors."""
    # Log the error, retry, or send a fallback UI
    return types.CallToolResult(content=[
        types.TextContent(
            type="text",
            text=f"Acknowledged error {code}: {message}"
        )
    ])
```

## Verbalization and Visibility Control

Control whether the LLM can "read" A2UI payloads in subsequent turns using MCP **Resource Annotations**:

```python
a2ui_resource = types.EmbeddedResource(
    type="resource",
    resource=types.TextResourceContents(
        uri="a2ui://training-plan-page",
        mimeType="application/json+a2ui",
        text=json.dumps(a2ui_payload)
    ),
    # Show the UI to the user, but hide the raw JSON from the LLM
    annotations=types.Annotations(audience=["user"])
)
```

| Audience | Behavior |
|----------|----------|
| *(empty)* | Visible to both user and LLM |
| `["user"]` | Rendered for the user; hidden from LLM context |
| `["assistant"]` | Available to LLM for follow-up reasoning; not rendered |

## Using the A2UI Agent SDK

For production use, the **A2UI Agent SDK** handles schema management, validation, and prompt generation for you:

```bash
pip install a2ui-agent-sdk
```

```python
from a2ui.schema.manager import A2uiSchemaManager
from a2ui.basic_catalog.provider import BasicCatalog

# Initialize the schema manager with the basic catalog
schema_manager = A2uiSchemaManager(
    catalogs=[BasicCatalog.get_config()],
)

# Validate A2UI output before sending
selected_catalog = schema_manager.get_selected_catalog()
selected_catalog.validator.validate(a2ui_payload)
```

See the full [Agent Development Guide](agent-development.md) for details on schema management, dynamic catalogs, and streaming.

## Next Steps

- [A2UI Specification](../specification/v0.9-a2ui.md) — full protocol reference
- [Component Gallery](../reference/components.md) — browse available components
- [MCP Apps in A2UI Surface](mcp-apps-in-a2ui-surface.md) — embed HTML-based MCP apps inside A2UI
- [Client Setup](client-setup.md) — build a renderer that displays A2UI
