import asyncio
from mcp.server import Server
from mcp.types import Resource, TextContent

app = Server("floor-plan-server")

RESOURCE_URI = "ui://floor-plan-server/map"
MIME_TYPE = "text/html;profile=mcp-app"


@app.list_resources()
async def list_resources() -> list[Resource]:
  return [
      Resource(
          uri=RESOURCE_URI,
          name="Interactive Floor Plan",
          mimeType=MIME_TYPE,
          description="A visual floor plan showing desk assignments.",
      )
  ]


@app.read_resource()
async def read_resource(uri: str) -> str | bytes:
  if str(uri) != RESOURCE_URI:
    raise ValueError(f"Unknown resource: {uri}")

  import os

  agent_static_url = os.environ.get("AGENT_STATIC_URL", "http://localhost:10004")

  html = """<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Floor Plan</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #f5f5f5;
            height: 100vh;
            width: 100vw;
        }

        #container {
            position: relative;
            max-width: 100%;
            max-height: 100%;
            transform-origin: center center;
            transition: transform 0.1s ease-out;
            user-select: none;
        }

        #floorplan {
            display: block;
            max-width: 100%;
            max-height: 100vh;
            object-fit: contain;
            -webkit-user-drag: none;
        }

        .hotspot {
            position: absolute;
            background-color: rgba(0, 128, 255, 0.2);
            border: 2px solid rgba(0, 128, 255, 0.5);
            cursor: pointer;
            transition: background-color 0.2s;
            border-radius: 4px;
        }

        .hotspot:hover {
            background-color: rgba(0, 128, 255, 0.4);
        }

        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: sans-serif;
            font-size: 12px;
            pointer-events: none;
            display: none;
            z-index: 10;
            white-space: nowrap;
        }

        #viewport {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            cursor: grab;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        #viewport.grabbing {
            cursor: grabbing;
        }
    </style>
</head>

<body>
    <div id="viewport">
        <div id="container">
            <img id="floorplan" src="__AGENT_STATIC_URL__/static/floorplan.png" alt="Office Floor Plan">
            <div id="tooltip" class="tooltip"></div>
        </div>
    </div>

    <script>
        const viewport = document.getElementById('viewport');
        const container = document.getElementById('container');
        const tooltip = document.getElementById('tooltip');

        // Initial mappings embedded from Python endpoint
        const deskMappings = [
            {deskId: "desk-1", contactId: "4", contactName: "Jane Doe"},
            {deskId: "desk-2", contactId: "1", contactName: "Alex Jordan"},
            {deskId: "desk-3", contactId: "3", contactName: "Jordan Taylor"},
            {deskId: "desk-4", contactId: "5", contactName: "John Smith"},
            {deskId: "desk-5", contactId: "6", contactName: "Alice Johnson"},
            {deskId: "desk-7", contactId: "2", contactName: "Casey Smith"}
        ];

        let scale = 2.5;
        let panning = false;
        let pointX = 0;
        let pointY = 0;
        let startX = 0;
        let startY = 0;
        let hostOrigin = '*';

        window.onload = () => { updateTransform(); };

        viewport.onmousedown = function (e) {
            e.preventDefault();
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
            panning = true;
            viewport.classList.add('grabbing');
        }

        viewport.onmouseup = function (e) { panning = false; viewport.classList.remove('grabbing'); }
        viewport.onmouseleave = function (e) { panning = false; viewport.classList.remove('grabbing'); }

        viewport.onmousemove = function (e) {
            if (panning) {
                e.preventDefault();
                pointX = e.clientX - startX;
                pointY = e.clientY - startY;
                updateTransform();
            }
            updateTooltipPos(e);
        }

        function zoom(factor) {
            scale *= factor;
            scale = Math.min(Math.max(0.5, scale), 6);
            updateTransform();
        }

        function updateTransform() {
            container.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        }

        const clusters = [
            { id: "desk-1", top: 10, left: 10, width: 8, height: 12 },
            { id: "desk-2", top: 10, left: 18, width: 8, height: 12 },
            { id: "desk-3", top: 22, left: 10, width: 8, height: 12 },
            { id: "desk-4", top: 22, left: 18, width: 8, height: 12 },
            { id: "desk-5", top: 10, left: 70, width: 10, height: 15 },
            { id: "desk-6", top: 10, left: 80, width: 10, height: 15 },
            { id: "desk-7", top: 40, left: 45, width: 10, height: 10 },
            { id: "desk-8", top: 60, left: 10, width: 8, height: 12 },
            { id: "desk-9", top: 60, left: 18, width: 8, height: 12 },
            { id: "desk-10", top: 72, left: 10, width: 8, height: 12 },
            { id: "desk-11", top: 72, left: 18, width: 8, height: 12 },
            { id: "desk-12", top: 60, left: 75, width: 15, height: 10 }
        ];

        function createHotspots() {
            document.querySelectorAll('.hotspot').forEach(el => el.remove());

            clusters.forEach(desk => {
                const mapping = deskMappings.find(m => m.deskId === desk.id);

                const el = document.createElement('div');
                el.className = 'hotspot';
                el.style.top = desk.top + '%';
                el.style.left = desk.left + '%';
                el.style.width = desk.width + '%';
                el.style.height = desk.height + '%';

                if (mapping) {
                    el.dataset.contactName = mapping.contactName;
                    el.dataset.contactId = mapping.contactId;

                    el.onmouseenter = (e) => {
                        tooltip.innerText = mapping.contactName;
                        tooltip.style.display = 'block';
                        updateTooltipPos(e);
                    };
                    el.onmousemove = updateTooltipPos;
                    el.onmouseleave = () => { tooltip.style.display = 'none'; };

                    el.onclick = () => {
                        // Protocol translation to MCP App standard
                        window.parent.postMessage({
                            jsonrpc: "2.0",
                            id: Date.now(),
                            method: "tools/call",
                            params: {
                                name: "chart_node_click",
                                arguments: {
                                    clickedNodeName: mapping.contactName,
                                    contactId: mapping.contactId,
                                    deskId: desk.id,
                                    source: 'modal'
                                }
                            }
                        }, hostOrigin);
                    };
                } else {
                    el.style.borderColor = 'rgba(0,0,0,0.1)';
                    el.style.backgroundColor = 'transparent';
                    el.style.cursor = 'default';
                    el.title = "Empty Desk";
                }

                container.appendChild(el);
            });
        }

        document.body.appendChild(tooltip);

        function updateTooltipPos(e) {
            if (tooltip.style.display === 'none') return;
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        }

        window.addEventListener('message', (event) => {
            // Capture the trusted host origin from the first incoming message
            if (hostOrigin === '*' && event.source === window.parent) {
                hostOrigin = event.origin;

                // MCP Handshake AFTER getting the origin securely
                window.parent.postMessage({
                    jsonrpc: "2.0",
                    id: Date.now(),
                    method: "ui/initialize",
                    params: {
                        appCapabilities: {},
                        clientInfo: { name: "Floor Plan App", version: "1.0.0" },
                        protocolVersion: "2026-01-26"
                    }
                }, hostOrigin);
            }
            
            const data = event.data;
            if (data && data.type === 'zoom') {
                zoom(data.payload.factor);
            }
        });

        createHotspots();
    </script>
</body>
</html>"""
  html = html.replace("__AGENT_STATIC_URL__", agent_static_url)
  return html


import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response
from starlette.routing import Mount, Route
from mcp.server.sse import SseServerTransport

sse = SseServerTransport("/messages/")


async def handle_sse(request: Request):
  """Handle the initial SSE connection from the A2UI agent."""
  async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
    await app.run(streams[0], streams[1], app.create_initialization_options())
  return Response()


starlette_app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse, methods=["GET"]),
        Mount("/messages/", app=sse.handle_post_message),
    ]
)

if __name__ == "__main__":
  uvicorn.run(starlette_app, host="127.0.0.1", port=8000)
