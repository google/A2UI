
## A2UI – Agent-to-User Interface

A2UI is an open-source specification and set of libraries that allow AI agents to describe **interactive user interfaces as structured data**, rather than executable code.

Instead of returning raw text, an agent can return a declarative UI description that client applications safely render using their own native components.

This enables agents to generate rich, interactive experiences while keeping execution, security, and control firmly in the hands of the client.

---

## Project Status

**Current version:** v0.8 (Public Preview)

A2UI is functional and actively evolving. The core concepts are stable, but the specification and component schemas may change as we move toward v1.0.

### Stable Areas

* Declarative component model
* Component ID and reference system
* Renderer architecture
* Incremental UI updates

### Likely to Change

* Component naming and properties
* Schema refinements
* Transport integrations

A2UI is suitable for experimentation, prototyping, and early production trials with version pinning.

---

## Why A2UI Exists

AI systems are good at generating text and logic, but they struggle to safely produce UI across different platforms.

Traditional approaches require agents to emit HTML, JSX, or framework-specific code, which introduces:

* Security risks
* Tight coupling to frontend stacks
* Poor portability across clients

A2UI solves this by letting agents **describe intent**, not implementation.

The client decides how that intent is rendered.

---

## Core Principles

### Security by Design

Agents never generate executable UI code. They emit structured data. The client only renders components from a predefined, trusted catalog.

### Agent-Friendly Format

The UI is represented as a flat, ID-based component list. This makes it easy for language models to generate, modify, and incrementally update.

### Framework Independence

The same A2UI payload can be rendered by web, mobile, or desktop clients using different frameworks.

### Extensibility

Clients can register custom components or wrappers, including sandboxed or legacy UI containers, while maintaining strict security boundaries.

---

## What Can You Build With A2UI

* Dynamic forms generated from conversation context
* Agent-driven dashboards and workflows
* Remote sub-agents returning UI to a host application
* Adaptive enterprise tools and internal systems

---

## How It Works

1. An agent produces an A2UI JSON payload
2. The payload is sent to the client
3. The client renderer validates the payload
4. Components are mapped to native UI elements
5. User events are routed back to the agent

UI generation and UI execution remain fully decoupled.

---

## Minimal Example

```json
{
  "components": [
    {
      "id": "card",
      "type": "card",
      "children": ["title", "action"]
    },
    {
      "id": "title",
      "type": "text",
      "value": "Welcome to A2UI"
    },
    {
      "id": "action",
      "type": "button",
      "label": "Continue",
      "onClick": { "event": "next_step" }
    }
  ]
}
```

The renderer decides how a `card`, `text`, or `button` is displayed using native components.

---

## Architecture Overview

* **Agents** generate A2UI payloads
* **Transports** deliver payloads to clients
* **Renderers** interpret and display components
* **Clients** control security, layout, and execution

A2UI integrates cleanly with agent frameworks and messaging protocols.

---

## Getting Started

### Requirements

* Node.js (for web renderers)
* Python (for agent samples)
* Gemini API key for full demo functionality

### Run the Demo

Clone the repository:

```bash
git clone https://github.com/google/A2UI.git
cd A2UI
```

Set your API key:

```bash
export GEMINI_API_KEY="your_api_key"
```

Run the agent:

```bash
cd samples/agent/adk/restaurant_finder
uv run .
```

Run the web client:

```bash
cd renderers/lit
npm install
npm run build

cd ../../samples/client/lit/shell
npm install
npm run dev
```

---

## Contribution Paths

You do not need to be an expert to contribute.

### Beginner-Friendly

* Improve documentation and examples
* Add validation or error handling
* Write sample payloads
* Improve README clarity

### Frontend Developers

* Build new renderers (React, Vue, SwiftUI)
* Improve accessibility and theming
* Optimize rendering performance

### Backend / Agent Developers

* Create new agent samples
* Improve incremental update patterns
* Add schema validation tools

### Spec and Design

* Propose new components
* Clarify semantics
* Review security assumptions

---

## License

A2UI is released under the Apache 2.0 License.

---

# 2. Suggested “Good First Issues”

These are realistic, beginner-safe issues you should label as `good first issue`.

### Documentation

1. Add a glossary explaining core A2UI terms
2. Write a “Common Mistakes” section
3. Add more minimal JSON examples
4. Improve error messages documentation

### Tooling

5. Create a JSON schema for validation
6. Add a payload linter CLI
7. Improve logging in renderers

### Renderers

8. Add keyboard accessibility support
9. Improve layout fallback handling
10. Add theme customization hooks

### Samples

11. Add a non-LLM mock agent
12. Add a form-based demo
13. Add a dashboard demo

---

# 3. React Renderer Starter Template (Design)

### Folder Structure

```
renderers/react/
  src/
    components/
      Card.tsx
      Button.tsx
      Text.tsx
    registry.ts
    Renderer.tsx
  package.json
  README.md
```

---

### Component Registry

```ts
export type ComponentRenderer = (props: any) => JSX.Element;

export const registry: Record<string, ComponentRenderer> = {};

export function register(type: string, renderer: ComponentRenderer) {
  registry[type] = renderer;
}
```

---

### Renderer Core

```tsx
export function A2UIRenderer({ payload }: { payload: any }) {
  return (
    <>
      {payload.components.map((component: any) => {
        const Renderer = registry[component.type];
        if (!Renderer) return null;
        return <Renderer key={component.id} {...component} />;
      })}
    </>
  );
}
```

---

### Example Component

```tsx
export function Text({ value }: { value: string }) {
  return <p>{value}</p>;
}
```

---

### Usage

```tsx
register("text", Text);
register("button", Button);
register("card", Card);

<A2UIRenderer payload={data} />
```

This gives contributors a clean, minimal entry point.

---

# 4. CONTRIBUTING.md Review & Improvement Plan

Since I haven’t seen your current file, here’s **what it should include** to be effective.

### Must-Have Sections

* How to set up the project locally
* Coding standards
* Commit message format
* How to submit a PR
* How issues are triaged

### Strong Improvements

* Add a “First Contribution” walkthrough
* Explain the renderer architecture clearly
* Define what maintainers expect in PRs
* Add a security reporting section



