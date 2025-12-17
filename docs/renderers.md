# Renderers (Client Libraries)

Renderers convert A2UI JSON messages into native UI components for different platforms.

The [agents](agents.md) are responsible for generating the A2UI messages,
and the [transports](transports.md) are responsible for delivering the messages to the client.
The client renderer library must buffer and handle A2UI messages, implement the A2UI lifecycle, and render surfaces (widgets).

You have a lot of flexibility, to bring custom comonents to a renderer, or build your own renderer to support your UI component framework.

## Available Renderers

| Renderer | Platform | Status | Links |
|----------|----------|--------|-------|
| **Lit (Web Components)** | Web | ✅ Stable | [Code](https://github.com/google/A2UI/tree/main/renderers/lit) |
| **Angular** | Web | ✅ Stable | [Code](https://github.com/google/A2UI/tree/main/renderers/angular) |
| **Flutter (GenUI SDK)** | Mobile/Desktop/Web | ✅ Stable | [Docs](https://docs.flutter.dev/ai/genui) · [Code](https://github.com/flutter/genui) |
| **React** | Web | 🚧 In Progress | Coming Q1 2026 |

Check the [Roadmap](roadmap.md) for more.

## How Renderers Work

```
A2UI JSON → Renderer → Native Components → Your App
```

1. **Receive** A2UI messages from the transport
2. **Parse** the JSON and validate against the schema
3. **Render** using platform-native components
4. **Style** according to your app's theme

## Quick Start

**Web Components (Lit):**

```bash
npm install @a2ui/lit
```

TODO: Add a quickstart guide

**Angular:**

```bash
npm install @a2ui/angular
```

TODO: Add a quickstart guide

**Flutter:**

```bash
flutter pub add flutter_genui
```

TODO: Add a quickstart guide

## Adding custom components to a renderer

TODO: Add a guide

## Theming or styling a renderer

TODO: Add a guide

## Building a Renderer

Want to build a renderer for your platform?

- See the [Roadmap](roadmap.md) for planned frameworks.
- Review existing renderers for patterns.
- Check out our [Renderer Development Guide](guides/renderer-development.md) for details on implementing a renderer.

### Key requirements:

- Parse A2UI JSON messages, specifically the adjacency list format
- Map A2UI components to native widgets
- Handle data binding, lifecycle events
- Process a sequence of incremental A2UI messages to build and update the UI
- Support server initiated updates
- Support user actions

### Next Steps

- **[Client Setup Guide](guides/client-setup.md)**: Integration instructions
- **[Quickstart](quickstart.md)**: Try the Lit renderer
- **[Component Reference](reference/components.md)**: What components to support
