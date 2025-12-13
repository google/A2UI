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
npm install @a2ui/renderer-lit
```

```typescript
import { A2UIRenderer } from '@a2ui/renderer-lit';

const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  onAction: (action) => { /* Send action to agent */ }
});

const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => {
  renderer.processMessage(JSON.parse(event.data));
};
```

## Angular

```bash
npm install @a2ui/renderer-angular
```

```typescript
// app.module.ts
import { A2UIModule } from '@a2ui/renderer-angular';

@NgModule({
  imports: [BrowserModule, A2UIModule.forRoot()],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

```typescript
// app.component.ts
import { A2UIService } from '@a2ui/renderer-angular';

@Component({
  template: '<a2ui-renderer [surfaceId]="'main'" (action)="handleAction($event)"></a2ui-renderer>'
})
export class AppComponent implements OnInit {
  constructor(private a2ui: A2UIService) {}

  ngOnInit() {
    const eventSource = new EventSource('/api/a2ui-stream');
    eventSource.onmessage = (event) => this.a2ui.processMessage(JSON.parse(event.data));
  }

  handleAction(action: any) { /* Send to backend */ }
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
  if (artifact.type === 'application/a2ui+jsonl') {
    artifact.content.split('\n').forEach(line => {
      if (line.trim()) renderer.processMessage(JSON.parse(line));
    });
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
- `INVALID_SURFACE_ID`: Send `createSurface` first
- `INVALID_COMPONENT_ID`: Check component IDs are unique
- `INVALID_PATH`: Verify data model structure
- `SCHEMA_VALIDATION_FAILED`: Check message format

## Next Steps

- **[Theming & Styling](theming.md)**: Customize the look and feel
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Agent Development](agent-development.md)**: Build agents that generate A2UI
- **[Reference Documentation](../reference/protocol.md)**: Deep dive into the protocol
