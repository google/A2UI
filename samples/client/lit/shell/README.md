# A2UI Generator

This is a UI to generate and visualize A2UI responses.

## Prerequisites

1. [nodejs](https://nodejs.org/en)

## Building and Running

This sample depends on the Lit renderer. To build and run this sample, you need to first build the renderer and then build the sample.

1. **Build the renderer:**
   ```bash
   cd ../../../renderers/lit
   npm install
   npm run build
   ```

2. **Build and run this sample:**
   ```bash
   cd - # back to the sample directory
   npm install
   npm run dev
   ```

After running `npm run dev`, you can open http://localhost:5173/ to view the sample.

_Note: The original running instructions are preserved below._

## Running

1. Install the dependencies: `npm i`
2. Run the [A2A server](../../../agent/adk/restaurant_finder/)
3. Run the dev server: `npm run dev`
4. Open http://localhost:5173/