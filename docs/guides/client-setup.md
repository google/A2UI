# Client Setup Guide

Integrate A2UI into your application using the renderer for your platform.

## Renderers

| Renderer                 | Platform           | Status            |
| ------------------------ | ------------------ | ----------------- |
| **Lit (Web Components)** | Web                | ✅ Stable          |
| **Angular**              | Web                | ✅ Stable          |
| **Flutter (GenUI SDK)**  | Mobile/Desktop/Web | ✅ Stable          |
| **React**                | Web                | 🚧 Coming Q1 2026  |
| **SwiftUI**              | iOS/macOS          | 🚧 Planned Q2 2026 |
| **Jetpack Compose**      | Android            | 🚧 Planned Q2 2026 |

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
npm install @a2ui/angular @a2ui/web-lib
```

The Angular renderer provides:

- **`provideA2UI()` function**: Configures A2UI in your app config
- **`Surface` component**: Renders A2UI surfaces
- **`MessageProcessor` service**: Handles incoming A2UI messages

TODO: Add verified setup example.

**See working example:** [Angular restaurant sample](https://github.com/google/a2ui/tree/main/samples/client/angular/projects/restaurant)

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

**See:** [Transports guide](../transports.md)

## Handling User Actions

When users interact with A2UI components (clicking buttons, submitting forms, etc.), the client:
1. Captures the action event from the component
2. Resolves any data context needed for the action
3. Sends the action to the agent
4. Processes the agent's response messages

TODO: Add action handling examples.

## Error Handling

Common errors to handle:
- **Invalid Surface ID**: Surface referenced before `beginRendering` was received
- **Invalid Component ID**: Component IDs must be unique within a surface
- **Invalid Data Path**: Check data model structure and JSON Pointer syntax
- **Schema Validation Failed**: Verify message format matches A2UI specification

TODO: Add error handling examples.

## Next Steps

- **[Quickstart](../quickstart.md)**: Try the demo application
- **[Theming & Styling](theming.md)**: Customize the look and feel
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Agent Development](agent-development.md)**: Build agents that generate A2UI
- **[Reference Documentation](../reference/messages.md)**: Deep dive into the protocol
