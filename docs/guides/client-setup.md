# Client Setup Guide

Integrate A2UI into your application using the renderer for your platform.

## Renderers

| Renderer                 | Platform           | v0.8 | v0.9 | Status            |
| ------------------------ | ------------------ | ---- | ---- | ----------------- |
| **[React](https://github.com/google/A2UI/tree/main/renderers/react)** | Web | ✅ | ❌ | ✅ Stable |
| **[Lit (Web Components)](https://github.com/google/A2UI/tree/main/renderers/lit)** | Web | ✅ | ✅ | ✅ Stable |
| **[Angular](https://github.com/google/A2UI/tree/main/renderers/angular)** | Web | ✅ | ✅ | ✅ Stable |
| **[Flutter (GenUI SDK)](https://docs.flutter.dev/ai/genui)** | Mobile/Desktop/Web | ✅ | ✅ | ✅ Stable |
| **SwiftUI**              | iOS/macOS          | —    | —    | 🚧 Planned Q2 2026 |
| **Jetpack Compose**      | Android            | —    | —    | 🚧 Planned Q2 2026 |

## Component Catalogs

A component catalog is any collection of components — the Basic Catalog, your own components, or shared libraries. **Your design system is what matters.** You can register any collection of components and functions, and A2UI will work with them. The catalog is just the contract between your agent and your renderer.

See [Defining Your Own Catalog](defining-your-own-catalog.md) for how to define a catalog that matches your design system.

## Shared Web Library

All web renderers (Lit, Angular, React) share a common foundation: **`@a2ui/web-lib`**. This library provides the message processor, state management, and data binding logic that every web renderer needs. Each framework-specific renderer builds on top of it, adding only the rendering layer for its framework.

This means core protocol handling is consistent across web platforms — only the component rendering differs.

## Web Components (Lit)

> ⚠️ **Attention**
>
> The Lit client library is not yet published to NPM. Check back in the
> coming days.

```bash
npm install @a2ui/web-lib lit @lit-labs/signals
```

The Lit renderer uses:

- **Message Processor**: Manages A2UI state and processes incoming messages
- **`<a2ui-surface>` component**: Renders surfaces in your app
- **Lit Signals**: Provides reactive state management for automatic UI updates

TODO: Add verified setup example.

**See working example:** [Lit shell sample](https://github.com/google/a2ui/tree/main/samples/client/lit/shell)

## Angular

> ⚠️ **Attention**
>
> The Angular client library is not yet published to NPM. Check back in the
> coming days.

```bash
npm install @a2ui/angular @a2ui/web_core
```

The Angular renderer provides:

- **`A2uiRendererService`**: A service that manages the A2UI message processor and reactive model.
- **`a2ui-v09-component-host` component**: A dynamic component host that renders A2UI components from a surface.
- **`A2UI_RENDERER_CONFIG` token**: Used to configure the renderer with catalogs and action handlers.

### Setup Example (v0.9)

A2UI uses versioned imports for its protocol-specific implementations. For v0.9, configure your application providers as follows:

```typescript
import { ApplicationConfig } from '@angular/core';
import { 
  A2UI_RENDERER_CONFIG, 
  A2uiRendererService, 
  minimalCatalog 
} from '@a2ui/angular/v0_9';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: A2UI_RENDERER_CONFIG,
      useValue: {
        catalogs: [minimalCatalog],
        actionHandler: (action) => {
          console.log('Action dispatched:', action);
        }
      }
    },
    A2uiRendererService
  ]
};
```

**See working example:** [Angular v0.9 Explorer](https://github.com/google/a2ui/tree/main/renderers/angular/a2ui_explorer)

## React

```bash
npm install @a2ui/react @a2ui/web-lib
```

The React renderer provides:

- **`<A2UISurface>` component**: Renders A2UI surfaces in your React app
- **`useA2UI()` hook**: Accesses the message processor from any component
- **`MessageProcessor` class**: Handles incoming A2UI messages (shared with other web renderers)

**See working example:** [React shell](https://github.com/google/A2UI/tree/main/samples/client/react/shell)

## Flutter (GenUI SDK)

```bash
flutter pub add flutter_genui
```

Flutter uses the GenUI SDK which provides native A2UI rendering.

**Docs:** [GenUI SDK](https://docs.flutter.dev/ai/genui) | [GitHub](https://github.com/flutter/genui) | [README in GenUI Flutter Package](https://github.com/flutter/genui/blob/main/packages/genui/README.md#getting-started-with-genui)

## Connecting to Agents

Your client application needs to:

1. **Receive A2UI messages** from the agent (via transport)
2. **Process messages** using the Message Processor
3. **Send user actions** back to the agent

Common transport options:

- **Server-Sent Events (SSE)**: One-way streaming from server to client
- **WebSockets**: Bidirectional real-time communication
- **A2A Protocol**: Standardized agent-to-agent communication with A2UI support

TODO: Add transport implementation examples.

**See:** [Transports guide](../concepts/transports.md)

## Handling User Actions

When users interact with A2UI components (clicking buttons, submitting forms, etc.), the client:

1. Captures the action event from the component
2. Resolves any data context needed for the action
3. Sends the action to the agent
4. Processes the agent's response messages

TODO: Add action handling examples.

## Error Handling

Common errors to handle:

- **Invalid Surface ID**: Surface referenced before `beginRendering` (v0.8) or `createSurface` (v0.9) was received
- **Invalid Component ID**: Component IDs must be unique within a surface
- **Invalid Data Path**: Check data model structure and JSON Pointer syntax
- **Schema Validation Failed**: Verify message format matches A2UI specification

TODO: Add error handling examples.

## Next Steps

- **[Quickstart](../quickstart.md)**: Try the demo application
- **[Theming & Styling](theming.md)**: Customize the look and feel
- **[Defining Your Own Catalog](defining-your-own-catalog.md)**: Extend the component catalog
- **[Agent Development](agent-development.md)**: Build agents that generate A2UI
- **[Reference Documentation](../reference/messages.md)**: Deep dive into the protocol
