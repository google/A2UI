# A2UI Generator

This is a UI to generate and visualize A2UI responses.

## Prerequisites

1. [nodejs](https://nodejs.org/en)

## Running

This sample depends on the Lit renderer. Before running this sample, you need to build the renderer.

1. **Build the renderer:**
   ```bash
   cd ../../../renderers/lit
   npm install
   npm run build
   ```

2. **Run this sample:**
   ```bash
   cd - # back to the sample directory
   npm install
   ```

3. **Run the servers:**
   - Run the [A2A server](../../../agent/adk/contact_multiple_surfaces/)
     - By default, the server uses the `McpAppsCustomComponent` which wraps MCP Apps in a secure, isolated double-iframe sandbox (`sandbox.html`) communicating strictly via JSON-RPC.
     - Optionally run the server using `USE_MCP_SANDBOX=false uv run .` to bypass this security and use the standard `WebFrame` element. 
     - **Observing the difference**: Search for "Alex Jordan" in the UI and click the Location button to open the floor plan. If you inspect the DOM using your browser's Developer Tools, you will see that `McpAppsCustomComponent` securely points the iframe `src` to the local proxy (`/sandbox.html`). In contrast, `WebFrame` directly injects the untrusted HTML via a data blob/srcdoc, lacking defense-in-depth origin isolation.
   - Run the dev server: `npm run dev`

After starting the dev server, you can open http://localhost:5173/ to view the sample.