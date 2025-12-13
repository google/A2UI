# What is A2UI?

**A2UI (Agent to UI) is a declarative UI protocol for agent-driven interfaces.** AI agents generate rich, interactive UIs that render natively across platforms (web, mobile, desktop) without executing arbitrary code.

## The Problem

**Text-only agent interactions are inefficient:**

```
User: "Book a table for 2 tomorrow at 7pm"
Agent: "Okay, for what day?"
User: "Tomorrow"
Agent: "What time?"
...
```

**Better:** Agent generates a form with date picker, time selector, and submit button. Users interact with UI, not text.

## The Challenge

In multi-agent systems, agents often run remotely (different servers, organizations). They can't directly manipulate your UI—they must send messages.

**Traditional approach:** Send HTML/JavaScript in iframes
- Heavy, visually disjointed
- Security complexity
- Doesn't match app styling

**Need:** Transmit UI that's safe like data, expressive like code.

## The Solution

A2UI: JSON messages describing UI that:
- LLMs generate as structured output
- Travel over any transport (A2A, AG UI, SSE, WebSockets)
- Client renders using its own native components

**Result:** Client controls security and styling, agent-generated UI feels native.

### Example

```json
{"createSurface": {"surfaceId": "booking"}}
```

```json
{"updateComponents": {"surfaceId": "booking", "components": [
  {"id": "title", "Text": {"text": {"literal": "Book Your Table"}, "style": "headline"}},
  {"id": "date-picker", "DatePicker": {"value": {"path": "/booking/date"}}},
  {"id": "submit-btn", "Button": {"text": {"literal": "Confirm"}, "onClick": {"actionId": "confirm_booking"}}}
]}}
```

Client renders as native components (Angular, Flutter, React, etc.).

## Core Value

**1. Security:** Declarative data, not code. Agent requests components from client's trusted catalog. No code execution risk.

**2. Native Feel:** No iframes. Client renders with its own UI framework. Inherits app styling, accessibility, performance.

**3. Portability:** One agent response works everywhere. Same JSON renders on web (Lit/Angular/React), mobile (Flutter/SwiftUI/Jetpack Compose), desktop.

## Design Principles

**1. LLM-Friendly:** Flat component list with ID references. Easy to generate incrementally, correct mistakes, stream.

**2. Framework-Agnostic:** Agent sends abstract component tree. Client maps to native widgets (web/mobile/desktop).

**3. Separation of Concerns:** Three layers—UI structure, application state, client rendering. Enables data binding, reactive updates, clean architecture.

## What A2UI Is NOT

- Not a framework (it's a protocol)
- Not a replacement for HTML (for agent-generated UIs, not static sites)
- Not a styling system (client controls styling)
- Not limited to web (works anywhere)

## Key Concepts

- **Surface**: Canvas for components (dialog, sidebar, main view)
- **Component**: UI element (Button, TextField, Card, etc.)
- **Data Model**: Application state, components bind to it
- **Catalog**: Available component types
- **Message**: JSON object (createSurface, updateComponents, etc.)

## Next Steps

Now that you understand what A2UI is, explore:

- **[Who is A2UI for?](who-is-it-for.md)** - Understand if A2UI is right for your use case
- **[How can I use it?](how-to-use.md)** - Learn the different ways to integrate A2UI
- **[Where is it used?](where-is-it-used.md)** - See real-world examples and integrations
- **[Quickstart Guide](../quickstart.md)** - Get hands-on in 5 minutes
