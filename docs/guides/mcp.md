# A2UI over Model Context Protocol (MCP)

This guide outlines how to use **A2UI** declarative syntax to build rich, interactive interfaces on top of **Model Context Protocol (MCP)** using Tools and Resources.

See samples at [MCP Samples](../../samples/agent/mcp).

## Catalog Negotiation

Before a server can send A2UI to a client, they must establish mutual support for the protocol and determine which catalogs are available. Depending on your system architecture, this capability negotiation can be handled in one of two ways: during the initial connection handshake or on a per-message basis.

### Option A: Catalog Handshake during MCP Initialization

Because MCP operates as a stateful session protocol, the most efficient approach is to declare capabilities exactly once when establishing the connection. The client declares its A2UI support under the capabilities object (often under an experimental or custom key) of the standard initialize request. The server stores this state for the duration of the session.

Example Initialize Request:

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

### Option B: Catalog Handshake on Each MCP Message (For Stateless Servers)

If your architecture requires the MCP Server to remain entirely stateless, the client can pass its A2UI version and catalog support in the `_meta` field of every tool call request. The server reads this metadata on the fly to determine which catalog to use for the response UI.

Example Call Request Metadata:

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

Embedded Resources allow a Tool to return the UI layout directly tied to that specific response, without requiring server-side storage or tracking.

- **URI**: Must use the `a2ui://` prefix with a descriptive name identifier (e.g., `a2ui://training-plan-page`).
- **MIME Type**: Must use `application/json+a2ui`. This ensures the MCP client routes the payload to the A2UI renderer rather than displaying raw JSON to the user. 

#### Python Implementation Example

```python
import mcp.types as types

@self.tool()
def get_hello_world_ui():
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
            uri="a2ui://training-plan-page",
            mimeType="application/json+a2ui",
            text=json.dumps(a2ui_payload),
        )
    )

    text_content = types.TextContent(
        type="text",
        text="Here is your generated training plan summary..."
    )
    
    return types.CallToolResult(content=[text_content, a2ui_resource])
```

## Handling User Actions

Interactive components (such as a `Button`) allow `actions` to be sent back to the server.

#### 1. A2UI JSON with an Action

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

#### 2. A2UI Action MCP Payload

When the button is clicked, the client resolves any absolute or relative path models (like `/dates/start` or `/dates/end`) against the surface binding state, and translates that into the MCP tool call arguments.

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

#### 3. Action Handler MCP Server Tool

The MCP server receives the tool call and executes the corresponding handler. 

```python
@self.tool()
async def action(action_payload: Dict[str, Any]) -> Dict[str, Any]:
    if action_payload["name"] == "confirm_booking":
        return {"response": f"Booking confirmed for {action_payload['context']['start']} to {action_payload['context']['end']}."}
    raise ValueError(f"Unknown action: {action_payload['name']}")
```

## Error Handling

Similarly to handling user interactions, the MCP server can also receive errors from the client.

#### 1. A2UI Error MCP Payload

When the client encounters an error with the A2UI payload, it can send an error MCP payload to the server.

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
      "surfaceId": "default",
    }
  }
}
```

#### 2. Error Handler MCP Server Tool

The MCP server receives the tool call and executes the corresponding handler. 

```python
@self.tool()
async def error(error_payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"response": f"Received A2UI error: {error_payload['error']}."}
```

## Verbalization and Visibility Control

You can control whether following assistant turns can "read" or interpret the backend payloads using MCP **Resource Annotations**.

```python
a2ui_resource = types.EmbeddedResource(
    type="resource",
    resource=types.TextResourceContents(
        uri="a2ui://training-plan-page",
        mimeType="application/json+a2ui",
        text=json.dumps(a2ui_payload)
    ),
    # Hide the raw JSON from the LLM, but show the UI to the user
    annotations=types.Annotations(audience=["user"]) 
)
```

- **Empty Audience**: Element visible to both user and LLM model.
- **Audience `user`**: Required to render item on view screens.
- **Audience `assistant`**: Allows content verbalization to trigger prompt inputs following consecutive turns. Disabling assistant limits agent contextual parsing but preserves discrete safe data leakage.
