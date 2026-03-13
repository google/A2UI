# A2UI Component Gallery Client

This is the client-side application for the A2UI Component Gallery. It is a Lit-based web application that connects to the Component Gallery Agent to render the UI components defined by the server.

## Overview

The client uses the `@a2ui/lit` renderer to interpret the JSON-based UI descriptions sent by the agent and render them as standard Web Components. It demonstrates:

- Rendering all **standard A2UI catalog components** (TextField, Button, Slider, Tabs, etc.)
- Creating and registering **custom components** (Chart, OrgChart, WebFrame)
- **Overriding standard components** with custom implementations (PremiumTextField replaces TextField)
- Sending an **inline catalog** so the agent knows which custom components the client supports

## Architecture

The gallery has two halves that work together:

| Layer | Directory | Role |
|-------|-----------|------|
| **Agent** | `samples/agent/adk/component_gallery/` | Defines surfaces, data models, and action handlers in `gallery_examples.py` |
| **Client** | `samples/client/lit/component_gallery/` | Renders surfaces using the `@a2ui/lit` renderer and custom components |

The agent sends A2UI JSON messages (via A2A protocol) describing component trees and data models. The client's `<a2ui-surface>` element renders them. For custom components, the client registers them with `componentRegistry` and sets `enableCustomElements` on the surface.

## Getting Started

To fully run the sample, you need to start **both** the Agent and the Client.

### Prerequisites

-   Python 3.10+ & `uv` (for Agent)
-   Node.js 18+ & `npm` (for Client)

### 1. Build the Renderer

The client depends on the `@a2ui/lit` renderer. Build it first:

```bash
cd renderers/lit
npm install
npm run build
```

### 2. Run the Agent (Backend)

The agent serves the UI definitions and handles user interactions.

```bash
cd samples/agent/adk/component_gallery
uv run .
```

The agent will run on `http://localhost:10005`.

### 3. Run the Client (Frontend)

Open a **new terminal**:

```bash
cd samples/client/lit/component_gallery
npm install
npm run dev
```

Open your browser to the URL shown (usually `http://localhost:5173`).

## Custom Components

The gallery includes four custom components in [`ui/custom-components/`](ui/custom-components/):

| Component | Type Name | Description |
|-----------|-----------|-------------|
| **Chart** | `Chart` | Interactive pie/doughnut/bar charts with drill-down (uses Chart.js) |
| **OrgChart** | `OrgChart` | Vertical organizational hierarchy with clickable nodes |
| **WebFrame** | `WebFrame` | Sandboxed iframe for embedding external content |
| **PremiumTextField** | `TextField` | Overrides the standard TextField with a custom-styled version |

### How Custom Components Work

1. **Client registers components** at startup in [`register-components.ts`](ui/custom-components/register-components.ts), called from [`client.ts`](client.ts):

    ```typescript
    componentRegistry.register("Chart", ChartComponent, "a2ui-custom-chart", {
      type: "object",
      properties: { chartType: { type: "string" }, /* ... */ },
      required: ["chartType", "chartData"],
    });
    ```

2. **Client sends its catalog** to the agent via the inline catalog mechanism in `A2UIClient.send()`:

    ```typescript
    const catalog = componentRegistry.getInlineCatalog();
    const finalMessage = { ...message, metadata: { inlineCatalogs: [catalog] } };
    ```

3. **Agent sends surfaces** that reference custom component types (in `gallery_examples.py`):

    ```python
    add_demo_surface("demo-chart-pie", {
        "Chart": {
            "chartType": "pie",
            "chartTitle": {"literalString": "Sales by Category"},
            "chartData": {"path": "galleryData/pieChartData"},
        }
    })
    ```

4. **Renderer resolves the type** via `componentRegistry.get("Chart")`, instantiates the element, and assigns properties including `processor` and `surfaceId` so the component can resolve path-based data references.

### Creating a New Custom Component

1. Create a TypeScript file in `ui/custom-components/` extending `Root` from `@a2ui/lit/ui`
2. Include `...Root.styles` in your `static styles` array
3. Use `this.processor.getData(this.component, path, this.surfaceId)` to resolve `{ path: "..." }` property references
4. Handle Map data — the model processor converts nested objects to Maps internally
5. Register the component in `register-components.ts` with a type name, tag name, and JSON schema
6. Add demo data to `gallery_examples.py` (agent side) and a `DEMO_ITEMS` entry in `component-gallery.ts`

See [`ui/custom-components/README.md`](ui/custom-components/README.md) for detailed documentation on each component and its properties.

## Attribution

This project uses media assets from the following sources:

*   **Video**: "Big Buck Bunny" (c) Copyright 2008, Blender Foundation / www.bigbuckbunny.org. Licensed under the Creative Commons Attribution 3.0 License.