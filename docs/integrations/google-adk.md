# Integrating A2UI with Google Agent Development Kit (ADK)

This guide shows how to connect A2UI's beautiful web interface with Google ADK agents using a protocol bridge.

## Overview

| Protocol | A2UI | ADK |
|----------|------|-----|
| **Format** | JSON-RPC 2.0 (A2A) | REST + SSE |
| **Request** | `message/send` method | POST `/apps/{app}/users/{user}/sessions/{session}/run_sse` |
| **Response** | A2UI Components | Text/SSE stream |

Since the protocols differ, we need a **bridge server** to translate between them.

## Architecture

```
┌─────────────────┐      A2A Protocol      ┌─────────────────┐      REST + SSE      ┌─────────────────┐
│  A2UI Frontend  │ ◀──────────────────▶  │  Bridge Server  │ ◀──────────────────▶ │   ADK Backend   │
│     :3000       │    JSON-RPC 2.0        │     :10002      │                      │     :8000       │
└─────────────────┘                        └─────────────────┘                      └─────────────────┘
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Google ADK (`pip install google-adk`)
- A2UI Lit renderer (this repo)

## Step 1: Create the Protocol Bridge

Create `bridge.py`:

```python
"""A2A-ADK Protocol Bridge"""
import json
import uuid
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="A2A-ADK Bridge")

# CORS for A2UI frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADK_BASE_URL = "http://localhost:8000"
ADK_APP_NAME = "your_adk_app"  # Replace with your ADK app name

# Session storage
user_sessions: dict[str, str] = {}

@app.get("/.well-known/agent-card.json")
async def agent_card():
    """A2A Agent Discovery endpoint"""
    return {
        "name": "Your ADK Agent",
        "description": "ADK agent accessible via A2UI",
        "url": "http://localhost:10002",
        "version": "1.0.0",
        "capabilities": {"streaming": False},
        "skills": [{"id": "chat", "name": "Chat"}],
    }

@app.post("/")
async def handle_a2a_request(request: Request):
    """Translate A2A JSON-RPC to ADK REST"""
    body = await request.json()
    method = body.get("method", "")
    request_id = body.get("id")
    
    if method == "message/send":
        params = body.get("params", {})
        message = params.get("message", {})
        parts = message.get("parts", [])
        
        # Extract text from A2A message
        user_text = ""
        for part in parts:
            if "text" in part:
                user_text = part["text"]
                break
        
        # Get or create ADK session
        user_id = "a2ui-user"
        if user_id not in user_sessions:
            user_sessions[user_id] = str(uuid.uuid4())
        session_id = user_sessions[user_id]
        
        # Forward to ADK
        async with httpx.AsyncClient(timeout=120.0) as client:
            adk_url = f"{ADK_BASE_URL}/apps/{ADK_APP_NAME}/users/{user_id}/sessions/{session_id}/run_sse"
            
            response = await client.post(
                adk_url,
                json={"message": user_text},
                headers={"Accept": "text/event-stream"}
            )
            
            # Parse SSE response
            response_text = await parse_sse_response(response)
        
        # Return A2A format
        return JSONResponse({
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "artifacts": [{
                    "parts": [{"text": response_text}]
                }]
            }
        })
    
    return JSONResponse({"jsonrpc": "2.0", "id": request_id, "result": {}})

async def parse_sse_response(response) -> str:
    """Extract text from ADK SSE response"""
    full_text = []
    
    for line in response.text.split("\n"):
        if line.startswith("data:"):
            try:
                data = json.loads(line[5:].strip())
                if "content" in data:
                    parts = data["content"].get("parts", [])
                    for part in parts:
                        if "text" in part:
                            full_text.append(part["text"])
            except json.JSONDecodeError:
                pass
    
    return "".join(full_text) if full_text else "Response received."

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10002)
```

## Step 2: Configure A2UI

Add your agent to A2UI's config (`samples/client/lit/shell/configs/`):

```typescript
// your-agent.ts
import type {AppConfig} from '../types';

export const config: AppConfig = {
  name: 'Your ADK Agent',
  agentCardUrl: 'http://localhost:10002/.well-known/agent-card.json',
};
```

Register it in `index.ts`:

```typescript
import {config as yourAgent} from './your-agent';
export const appConfigs: AppConfig[] = [
  // ... existing configs
  yourAgent,
];
```

## Step 3: Run the Stack

```bash
# Terminal 1: ADK Backend
python -m google.adk.cli web ./src

# Terminal 2: Bridge Server
python bridge.py

# Terminal 3: A2UI Frontend
cd samples/client/lit/shell
npx vite dev --port 3000  # Use npx directly on Windows
```

Open `http://localhost:3000/?app=your-agent`

## Windows Notes

On Windows, use `npx vite dev` instead of `npm run dev` due to `wireit` shell compatibility.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `CORS errors` | Ensure bridge allows frontend origin |
| `Session not persisting` | Check user_sessions dictionary |
| `Empty responses` | ADK may return function calls - add handling |

## Example Implementation

See [AI Technical Interviewer](https://github.com/VIKAS9793/ai-interviewer-google-adk) for a complete working example with multi-agent orchestration.

## Contributing

This guide was contributed based on real-world integration experience. For improvements, please open an issue or PR.
