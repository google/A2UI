import os
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Minimal HTML for the MCP app showing 2-way communication
# It uses the AppBridge to call a tool on the host.
MCP_APP_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>MCP Sample App</title>
    <style>
        body { font-family: sans-serif; padding: 10px; }
        button { padding: 8px 16px; background: #137fec; color: white; border: none; border-radius: 4px; cursor: pointer; }
        #status { margin-top: 10px; color: green; }
    </style>
</head>
<body>
    <h3>MCP Sandboxed App</h3>
    <div id="data">Initial Data: <span id="val">None</span></div>
    <br/>
    <button id="actionBtn">Call Agent Tool</button>
    <div id="status"></div>

    <script type="importmap">
    {
      "imports": {
        "@modelcontextprotocol/sdk/types.js": "http://127.0.0.1:5173/@fs/Users/mandard/work/agents/a2ui/samples/client/lit/node_modules/@modelcontextprotocol/sdk/dist/esm/types.js",
        "@modelcontextprotocol/sdk/shared/protocol.js": "http://127.0.0.1:5173/@fs/Users/mandard/work/agents/a2ui/samples/client/lit/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js"
      }
    }
    </script>
    <script type="module">
        import { App as AppBridge } from 'http://127.0.0.1:5173/@fs/Users/mandard/work/agents/a2ui/samples/client/lit/node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js';

        const bridge = new AppBridge({ name: "mcp-app-sample", version: "1.0.0" });

        async function init() {
            const statusEl = document.getElementById('status');
            console.log("[MCP App Iframe] init() started");
            statusEl.innerText = "Initializing bridge...";
            try {
                console.log("[MCP App Iframe] Calling bridge.connect()...");
                await bridge.connect();
                console.log("[MCP App Iframe] bridge.connect() resolved!");
                statusEl.innerText = "Connected to host!";

                document.getElementById('actionBtn').addEventListener('click', async () => {
                    console.log("[MCP App Iframe] Button clicked!");
                    statusEl.innerText = "Calling tool...";
                    try {
                        console.log("[MCP App Iframe] Calling bridge.callServerTool...");
                        const res = await bridge.callServerTool({
                            name: "trigger_agent_action",
                            arguments: { foo: 'bar' }
                        });
                        console.log("[MCP App Iframe] Tool response:", res);
                        statusEl.innerText = "Tool response received!";
                    } catch (err) {
                        console.error("[MCP App Iframe] Tool error:", err);
                        statusEl.innerText = "Error: " + err.message;
                    }
                });

            } catch (err) {
                console.error("[MCP App Iframe] Connection failed:", err);
                statusEl.innerText = "Connection failed: " + err.message;
            }
        }

        init();
    </script>
</body>
</html>
"""

@app.post("/a2a")
async def handle_a2a(request: Request):
    body = await request.json()
    print("Received A2A request:", body)
    
    req_id = body.get("id")
    
    # Check if it's a request to load the app or an action
    params = body.get("params", {})
    message = params.get("message", {})
    parts = message.get("parts", [])
    
    req_text = ""
    user_action = {}
    
    if parts:
        part = parts[0]
        if part.get("kind") == "data":
            data = part.get("data", {})
            req_text = data.get("request", "")
            user_action = data.get("userAction", {})
            
    if req_text == "Load MCP App":
        # Return the surface with the McpApp component
        response_data = [
            {
                "beginRendering": {
                    "surfaceId": "mcp-surface",
                    "root": "mcp-app-root"
                }
            },
            {
                "surfaceUpdate": {
                    "surfaceId": "mcp-surface",
                    "components": [
                        {
                            "id": "mcp-app-root",
                            "component": {
                                "McpApp": {
                                    "resourceUri": "custom://mcp-sample-app",
                                    "htmlContent": MCP_APP_HTML,
                                    "allowedTools": ["trigger_agent_action"]
                                }
                            }
                        }
                    ]
                }
            }
        ]
        return JSONResponse(content={
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "kind": "task",
                "status": {
                    "message": {
                        "parts": response_data
                    }
                }
            }
        })
        
    elif user_action.get("name") == "trigger_agent_action":
        # Handle the tool call forwarded by the client
        context = user_action.get("context", {})
        print("Agent handling trigger_agent_action with context:", context)
        
        # Return a response that might update the UI or just confirm
        response_data = [
            {
                "beginRendering": {
                    "surfaceId": "mcp-response-surface",
                    "root": "mcp-response-root"
                }
            },
            {
                "surfaceUpdate": {
                    "surfaceId": "mcp-response-surface",
                    "components": [
                        {
                            "id": "mcp-response-root",
                            "component": {
                                "Text": {
                                    "text": {
                                        "literalString": "Agent processed action: " + json.dumps(context)
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]
        print("Agent responding with:", {"jsonrpc": "2.0", "id": req_id, "result": "..."})
        return JSONResponse(content={
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "kind": "task",
                "status": {
                    "message": {
                        "parts": response_data
                    }
                }
            }
        })
        
    # Default fallback
    return JSONResponse(content={
        "jsonrpc": "2.0",
        "id": req_id,
        "result": {
            "kind": "task",
            "status": {
                "message": {
                    "parts": [{"kind": "text", "text": "I'm not sure how to handle that."}]
                }
            }
        }
    })



@app.get("/.well-known/agent-card.json")
async def handle_card():
    return {
        "url": "http://localhost:8000/a2a",
        "endpoint": "http://localhost:8000/a2a"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
