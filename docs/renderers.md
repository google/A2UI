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

##### Usage
```typescript
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { v0_8 } from '@a2ui/lit';
// Import UI components registry
import '@a2ui/lit/ui'; 

@customElement('my-app')
export class MyApp extends LitElement {
  // 1. Create a MessageProcessor
  #processor = v0_8.Data.createSignalA2uiMessageProcessor();

  // 2. Feed it messages (e.g., from your transport)
  handleMessage(message: v0_8.Types.ServerToClientMessage) {
    this.#processor.processMessages([message]);
  }

  render() {
    // 3. Render the surfaces
    return html`
      ${repeat(
        this.#processor.getSurfaces(),
        ([id]) => id,
        ([id, surface]) => html`
          <a2ui-surface
            .surfaceId=${id}
            .surface=${surface}
            .processor=${this.#processor}
          ></a2ui-surface>
        `
      )}
    `;
  }
}
```

**Angular:**

```bash
npm install @a2ui/angular
```

##### Usage
```typescript
import { Component, inject } from '@angular/core';
import { MessageProcessor, Surface } from '@a2ui/angular';
import { Types } from '@a2ui/lit/0.8';

@Component({
  selector: 'app-root',
  template: `
    @for (surface of processor.surfaces(); track surface.id) {
       <a2ui-surface [surfaceId]="surface.id" [surface]="surface.state" />
    }
  `,
  imports: [Surface],
  standalone: true
})
export class AppComponent {
  // 1. Inject the MessageProcessor
  protected processor = inject(MessageProcessor);

  // 2. Feed it messages
  handleMessage(message: Types.ServerToClientMessage) {
    this.processor.processMessages([message]);
  }
}
```

**Flutter:**

```bash
flutter pub add flutter_genui
```

##### Usage
See the [GenUI Quickstart](https://docs.flutter.dev/ai/genui/get-started) for a complete tutorial.

```dart
// 1. Define your widgets
class MyWidgetFactory extends WidgetFactory {
  // ... map A2UI types to Flutter widgets
}

// 2. Use the GenUiArea
GenUiArea(
  messageStream: myMessageStream,
  widgetFactory: MyWidgetFactory(),
)
```

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
