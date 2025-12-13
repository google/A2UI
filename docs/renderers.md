# Renderers (Client Libraries)

Renderers convert A2UI JSON messages into native UI components for different platforms.

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

1. **Receive** A2UI messages from an agent
2. **Parse** the JSON and validate against schema
3. **Render** using platform-native components
4. **Client Style** according to your app's theme

## Quick Start

**Web Components (Lit):**

```bash
npm install @a2ui/lit
```

**Angular:**

```bash
npm install @a2ui/angular
```

**Flutter:**

```bash
flutter pub add flutter_genui
```

## Building a Renderer

Want to build a renderer for your platform? 

- See the [Roadmap](roadmap.md) for planned frameworks.
- Review existing renderers for patterns.

### Key requirements:

- Parse A2UI JSON messages
- Map A2UI components to native widgets
- Handle data binding and updates
- Support user actions

### Next Steps

- **[Client Setup Guide](guides/client-setup.md)**: Integration instructions
- **[Quickstart](quickstart.md)**: Try the Angular renderer
- **[Component Reference](reference/components.md)**: What components to support
