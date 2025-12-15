# Client Setup Guide

Integrate A2UI into your application using the renderer for your platform.

## Renderers

| Renderer | Platform | Status |
|----------|----------|--------|
| **Lit (Web Components)** | Web | ✅ Stable |
| **Angular** | Web | ✅ Stable |
| **Flutter (GenUI SDK)** | Mobile/Desktop/Web | ✅ Stable |
| **React** | Web | 🚧 Coming Q1 2026 |
| **SwiftUI** | iOS/macOS | 🚧 Planned Q2 2026 |
| **Jetpack Compose** | Android | 🚧 Planned Q2 2026 |

## Web Components (Lit)

```bash
npm install @a2ui/web-lib lit @lit-labs/signals
```

The Lit renderer uses a `MessageProcessor` to manage state and `<a2ui-surface>` components to render the UI. It uses Lit Signals (`@lit-labs/signals`) to automatically update the UI when the state changes.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { v0_8 } from '@a2ui/web-lib';
import '@a2ui/web-lib/ui'; // Registers all <a2ui-*> components

// 1. Create a message processor
const processor = v0_8.Data.createSignalA2uiMessageProcessor();

@customElement('my-a2ui-app')
export class MyA2uiApp extends LitElement {
  
  constructor() {
    super();
    
    // 2. Connect to a stream of A2UI messages
    const eventSource = new EventSource('/api/a2ui-stream');
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data) as v0_8.Types.ServerToClientMessage;
      // 3. Process incoming messages
      processor.processMessages([message]);
    };
  }
  
  render() {
    // 4. Render the surface. It will update automatically.
    return html`
      <a2ui-surface
        surfaceId="main"
        .processor=${processor}
        @a2uiaction=${this.handleAction}
      ></a2ui-surface>
    `;
  }
  
  // 5. Handle user actions
  async handleAction(event: v0_8.Events.StateEvent<'a2ui.action'>) {
    // Logic to resolve context and send action to the backend...
    const action = event.detail.action;
    console.log('Action dispatched:', action.name);
  }
}
```

## Angular

```bash
npm install @a2ui/angular @a2ui/web-lib
```

The Angular renderer provides a `Surface` component to render A2UI surfaces and a `MessageProcessor` service to handle incoming messages.

**1. Provide the MessageProcessor**

In your `app.config.ts`, provide the `MessageProcessor`.

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { MessageProcessor } from '@a2ui/angular';

export const appConfig: ApplicationConfig = {
  providers: [MessageProcessor],
};
```

**2. Use the Surface Component**

In your component, inject the `MessageProcessor` and use the `a2ui-surface` component in your template.

```typescript
// app.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { MessageProcessor, Surface } from '@a2ui/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Surface],
  template: '<a2ui-surface surfaceId="main"></a2ui-surface>'
})
export class AppComponent implements OnInit {
  processor = inject(MessageProcessor);

  ngOnInit() {
    // Connect to a stream of A2UI messages
    const eventSource = new EventSource('/api/a2ui-stream');
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.processor.processMessages([message]);
    };

    // Example of handling an action
    this.processor.events.subscribe(async (event) => {
      // Send action to backend...
      const response = await fetch('/api/action', { 
        method: 'POST',
        body: JSON.stringify(event.message)
      });
      const messages = await response.json();
      
      // Process response and complete the event
      this.processor.processMessages(messages);
      event.completion.next(messages);
    });
  }
}
```

## Flutter (GenUI SDK)

```yaml
dependencies:
  flutter_genui: ^0.1.0
```

```dart
import 'package:flutter_genui/flutter_genui.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: GenUIScreen(
        agentUrl: 'https://your-agent-endpoint.com',
        onAction: (action) => print('Action: $action'),
      ),
    );
  }
}
```

**Docs:** [GenUI SDK](https://docs.flutter.dev/ai/genui) | [GitHub](https://github.com/flutter/genui)

## Connecting to Agents

### Server-Sent Events (SSE)

```typescript
const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => renderer.processMessage(JSON.parse(event.data));
```

### WebSockets

```typescript
const ws = new WebSocket('wss://your-server.com/a2ui');
ws.onmessage = (event) => renderer.processMessage(JSON.parse(event.data));
ws.send(JSON.stringify(action)); // Send actions
```

### A2A Protocol

```typescript
import { A2AClient } from '@a2a/client';

const client = new A2AClient({agentUrl: 'https://your-a2a-agent.com'});
client.on('artifact', (artifact) => {
  if (artifact.type === 'application/json+a2ui' && artifact.content) {
    renderer.processMessage(JSON.parse(artifact.content));
  }
});
```

## Handling User Actions

```typescript
const renderer = new A2UIRenderer({
  onAction: async (action) => {
    const response = await fetch('/api/actions', {method: 'POST', body: JSON.stringify(action)});
    const messages = await response.json();
    messages.forEach(msg => renderer.processMessage(msg));
  }
});
```

## Error Handling

```typescript
const renderer = new A2UIRenderer({
  onError: (error) => {
    console.error('A2UI Error:', error);
    // Optionally send errors back to agent for correction
  }
});
```

**Common Errors:**
- `INVALID_SURFACE_ID`: A surface was referenced before a `beginRendering` message was received for it.
- `INVALID_COMPONENT_ID`: Check component IDs are unique
- `INVALID_PATH`: Verify data model structure
- `SCHEMA_VALIDATION_FAILED`: Check message format

## Next Steps

- **[Theming & Styling](theming.md)**: Customize the look and feel
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Agent Development](agent-development.md)**: Build agents that generate A2UI
- **[Reference Documentation](../reference/messages.md)**: Deep dive into the protocol
