# A2UI Generator

This is a UI to generate and visualize A2UI responses.

## Prerequisites

1. [nodejs](https://nodejs.org/en)

## Running

This sample depends on the Lit renderer. Before running this sample, you need to build the renderer.

   cd ../../../renderers/web_core
   npm install
   npm run build
   cd ../lit
   npm install
   npm run build
   

2. **Run this sample:**
   ```bash
   cd - # back to the sample directory
   npm install
   ```

3. **Run the servers:**
   - Run the [A2A server](../../../agent/adk/contact_lookup/)
   - Run the dev server: `npm run dev`

After starting the dev server, you can open http://localhost:5173/ to view the sample.