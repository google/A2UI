# Use A2UI with Any Agent Framework (Using AG-UI)

A2UI describes _what_ the UI should look like. [AG-UI](https://ag-ui.com/) is a thin,
framework-neutral transport that moves messages between an agent and a web client.
Together they let any agent — LangGraph, CrewAI, Mastra, ADK, a custom Python
service, a Next.js API route — speak A2UI to a React frontend without writing
transport glue yourself.

This guide walks through the end-to-end picture: where A2UI sits in an AG-UI
pipeline, how to wire up the catalog on the frontend, how to emit A2UI
operations from the backend, and two patterns (fixed vs. dynamic schemas) for
choosing which layouts the agent can produce.

## When to use this

Pick A2UI + AG-UI when you want:

- **One agent, many renderers.** The same A2UI payload can render in React
  (AG-UI), Lit, Flutter, Angular, or anywhere else A2UI is supported.
- **Safe generative UI.** The agent can only render components that your
  frontend has registered in a [catalog](../concepts/catalogs.md). No arbitrary
  code, no arbitrary markup.
- **A framework-agnostic agent.** You are not tied to a specific agent SDK.
  Anything that can emit JSON over the AG-UI event stream can speak A2UI.

If your agent already talks [A2A](../concepts/transports.md#a2a-protocol),
prefer the [A2A extension](../specification/v0.8-a2a-extension.md). AG-UI is the
right choice when your frontend is a React app and you want streaming UI
updates with minimal wiring.

## How A2UI and AG-UI fit together

```
┌──────────────┐   AG-UI events    ┌─────────────────┐   A2UI ops    ┌────────────┐
│  Your Agent  │ ────────────────> │  AG-UI runtime  │ ────────────> │  Catalog   │
│ (any fwk.)   │                   │ (Next.js route) │               │ renderers  │
└──────────────┘ <──────────────── └─────────────────┘ <──────────── └────────────┘
       ▲           tool events /          ▲      │                     (your
       │           actions                │      │                      React
       │                                  │      ▼                      comps)
       │                            ┌─────────────────┐
       └───── user input ────────── │  React client   │
                                    │  (CopilotKit)   │
                                    └─────────────────┘
```

Roles:

- **Agent.** Produces A2UI operations (`createSurface`, `updateComponents`,
  `updateDataModel`). The operations are just JSON — the agent framework is
  an implementation detail.
- **AG-UI runtime.** Bridges the agent and the browser. A2UI operations ride on
  the AG-UI event stream as activity messages; AG-UI handles reconnection,
  backpressure, and state sync.
- **Catalog + renderers.** A typed registry on the frontend mapping component
  names (e.g. `DashboardCard`) to the React components that render them. The
  agent can only render components the catalog declares.

The key invariant: **the agent never ships React, HTML, or CSS**. It ships A2UI
operations naming components your app already trusts.

## Quickstart (CopilotKit)

The fastest path today is CopilotKit's AG-UI implementation. This takes you
from zero to a running A2UI surface in two commands.

### 1. Scaffold the starter

```bash
npx copilotkit@latest create my-app --framework a2ui
cd my-app
```

The `a2ui` framework scaffolds a Next.js app paired with an agent backend,
preconfigured with an A2UI catalog and the AG-UI middleware. `-f a2ui` works
as a shorthand.

### 2. Install and run

```bash
pnpm install
cp .env.example .env   # add your model provider API key
pnpm dev
```

`pnpm dev` starts the Next.js UI and the agent concurrently. Open
<http://localhost:3000> and send a message — the agent responds with an A2UI
surface rendered from your catalog.

!!! tip "Try it without installing anything"

    CopilotKit also hosts a public [A2UI Widget Builder](https://go.copilotkit.ai/A2UI-widget-builder)
    and the [A2UI Composer](https://a2ui-composer.ag-ui.com/) — both let you
    generate A2UI JSON visually and paste it into any agent prompt.

## Register a catalog on the frontend

The catalog is the contract between your agent and your UI. It has two files:

- **Definitions** — Zod schemas plus a natural-language description. This is
  what the agent sees.
- **Renderers** — React components, type-checked against the schemas. This is
  what the user sees.

### Definitions

```ts title="src/app/catalog/definitions.ts"
import { z } from "zod";

export const demonstrationCatalogDefinitions = {
  Metric: {
    description:
      "A key metric display with label, value, and optional trend indicator. Great for KPIs and stats.",
    props: z.object({
      label: z.string(),
      value: z.string(),
      trend: z.enum(["up", "down", "neutral"]).optional(),
      trendValue: z.string().optional(),
    }),
  },
  DashboardCard: {
    description:
      "A card container with title and optional subtitle. Has a 'child' slot for content.",
    props: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      child: z.string().optional(),
    }),
  },
};

export type DemonstrationCatalogDefinitions =
  typeof demonstrationCatalogDefinitions;
```

The `description` field matters — it is injected into the agent's system prompt
so the LLM knows when to reach for each component.

### Renderers

```tsx title="src/app/catalog/renderers.tsx"
"use client";
import {
  createCatalog,
  type CatalogRenderers,
} from "@copilotkit/a2ui-renderer";
import {
  demonstrationCatalogDefinitions,
  type DemonstrationCatalogDefinitions,
} from "./definitions";

const renderers: CatalogRenderers<DemonstrationCatalogDefinitions> = {
  Metric: ({ props }) => (
    <div className="flex flex-col">
      <span className="text-sm opacity-70">{props.label}</span>
      <strong className="text-2xl">{props.value}</strong>
      {props.trend && <span>{props.trendValue}</span>}
    </div>
  ),
  DashboardCard: ({ props, children }) => (
    <div className="rounded-xl border p-5">
      <h3>{props.title}</h3>
      {props.subtitle && <p className="opacity-70">{props.subtitle}</p>}
      {props.child && children(props.child)}
    </div>
  ),
};

export const demonstrationCatalog = createCatalog(
  demonstrationCatalogDefinitions,
  renderers,
  { catalogId: "copilotkit://app-dashboard-catalog" },
);
```

### Mount the provider

Register the catalog once, at the root of the React tree:

```tsx title="src/app/layout.tsx"
"use client";
import "@copilotkit/react-core/v2/styles.css";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { demonstrationCatalog } from "./catalog/renderers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          a2ui={{ catalog: demonstrationCatalog }}
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

!!! info "A2UI lives on the v2 runtime"

    The import path is `@copilotkit/react-core/v2`. A2UI surfaces render
    through the v2 runtime — the classic (v1) runtime does not include the
    A2UI renderer.

## Emitting A2UI from the agent

The agent's job is to stream three kinds of operation, in order:

| Operation         | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `createSurface`   | Opens a new surface bound to a catalog.                |
| `updateComponents`| Sends (or replaces) the component tree on the surface. |
| `updateDataModel` | Writes values into the surface's data model.           |

### Minimal v0.9 payload

```json
{"version": "v0.9", "createSurface": {
  "surfaceId": "main",
  "catalogId": "copilotkit://app-dashboard-catalog"
}}

{"version": "v0.9", "updateComponents": {
  "surfaceId": "main",
  "components": [
    {"id": "card",   "component": "DashboardCard", "title": "Revenue",
     "subtitle": "This quarter", "child": "metric"},
    {"id": "metric", "component": "Metric",
     "label": "MRR", "value": {"path": "/metrics/mrr"},
     "trend": "up", "trendValue": "+12%"}
  ]
}}

{"version": "v0.9", "updateDataModel": {
  "surfaceId": "main",
  "path": "/metrics",
  "value": {"mrr": "$42,500"}
}}
```

Each line is a complete A2UI message. Stream them as they are produced — the
renderer applies updates incrementally.

!!! note "v0.8 vs v0.9"

    These snippets use the [v0.9 draft](../specification/v0.9-a2ui.md) format
    (`createSurface`, flat component shape, plain JSON data model). If you
    are pinned to v0.8, swap in `surfaceUpdate` / `beginRendering` and the
    wrapped-key data model. See the [evolution guide](../specification/v0.9-evolution-guide.md)
    for a side-by-side diff.

### Where these messages come from

There are two patterns for generating the component tree. They share the
same frontend catalog.

| Pattern           | Who builds the tree                     | Best for                                                  |
| ----------------- | --------------------------------------- | --------------------------------------------------------- |
| **Fixed schema**  | You. Agent provides data only.          | Known layouts (product cards, flight itineraries).        |
| **Dynamic schema**| A secondary LLM call per turn.          | Open-ended UI that changes with the conversation.         |

**Fixed schema** trades flexibility for determinism — you hand-write
`updateComponents` once and the agent only fills in `updateDataModel`. Cheaper,
faster, easier to test.

**Dynamic schema** asks an LLM to author both the tree and the data. More
expressive, slower, and requires good examples and validation in the agent
prompt. The restaurant finder samples in this repo use this pattern — see
[samples/agent/adk/restaurant_finder](https://github.com/google/A2UI/tree/main/samples/agent/adk/restaurant_finder)
for a full walkthrough.

## Handling user actions

Interactive components (buttons, inputs) emit AG-UI tool events when the user
interacts. Define the tool on the agent; AG-UI wires the component's `action`
to a tool call automatically.

```json
{"id": "book-btn", "component": "Button", "child": "book-label",
 "variant": "primary",
 "action": {"event": {"name": "book_restaurant",
                      "context": [{"key": "restaurantId",
                                   "value": {"path": "/selection/id"}}]}}}
```

When the user clicks, the agent receives a `book_restaurant` tool call with
`restaurantId` as an argument. Respond by calling back with more
A2UI operations (e.g. a confirmation surface) or with plain text.

## Bringing your own agent framework

AG-UI is a thin wrapper — any framework that can stream JSON can produce
A2UI. Integration boils down to two responsibilities:

1. **Emit the three operations** (`createSurface`, `updateComponents`,
   `updateDataModel`) as AG-UI activity events.
2. **Handle tool calls** when the user interacts with rendered components.

Community integrations exist for several popular frameworks (LangGraph,
Mastra, CrewAI, and more) — see the
[AG-UI documentation](https://docs.ag-ui.com/) for the current list. For a
custom agent, the AG-UI SDK provides the event types you need; emit A2UI
operations as `ACTIVITY` events and let CopilotKit's renderer do the rest.

## Troubleshooting

### The surface never appears

- Confirm the catalog is passed to `<CopilotKit a2ui={{ catalog }}>` and that
  you are importing from `@copilotkit/react-core/v2`.
- Check the browser devtools network tab for the AG-UI stream. If the stream
  is open but no `createSurface` arrives, the agent is likely not emitting
  A2UI messages.

### Components render blank

- Every component referenced in `updateComponents` must exist in the catalog
  you registered. A missing component is skipped silently — check the browser
  console for a warning listing the unknown name.

### Data bindings show literal paths (e.g. `/metrics/mrr`)

- The `updateDataModel` call must reach the surface _after_ `updateComponents`.
  Stream order matters. Re-check the agent's emission order.

## What's next

- **[Catalogs](../concepts/catalogs.md)** — the reference for catalog authoring,
  component schemas, and custom props.
- **[Transports](../concepts/transports.md)** — compare AG-UI with A2A and
  raw HTTP.
- **[v0.9 specification](../specification/v0.9-a2ui.md)** — the full message
  shape, including `createSurface`, client-side functions, and extensions.
- **[CopilotKit A2UI Widget Builder](https://go.copilotkit.ai/A2UI-widget-builder)**
  — generate A2UI JSON from a visual editor.
