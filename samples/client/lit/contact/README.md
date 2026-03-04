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

3. **Run the backend servers:**
   - Based on which demo you want to test, run one of the ADK agents:
     - For the simple card demo: [A2A contact_lookup server](../../../agent/adk/contact_lookup/)
     - For the advanced MCP Apps demo: [A2A contact_multiple_surfaces server](../../../agent/adk/contact_multiple_surfaces/). *Note: This sample also requires running `uv run floor_plan_server.py` alongside the main agent.*

4. **Run the dev server:**
   ```bash
   npm run dev
   ```

After starting the frontend dev server and your choice of backend servers, open `http://localhost:5173/` to view the sample.