# Client Setup Guide

This guide walks you through integrating A2UI into your application. We'll cover the available renderers and how to set them up for different platforms.

## Choose Your Renderer

A2UI provides official renderers for multiple platforms:

| Renderer | Platform | Status | Best For |
|----------|----------|--------|----------|
| **Web Components (Lit)** | Web | ✅ Stable | Framework-agnostic web apps |
| **Angular** | Web | ✅ Stable | Angular applications |
| **Flutter (GenUI SDK)** | Mobile/Desktop/Web | ✅ Stable | Cross-platform apps |
| **React** | Web | 🚧 Coming Soon | React applications |
| **SwiftUI** | iOS/macOS | 🚧 Planned | Native Apple apps |
| **Jetpack Compose** | Android | 🚧 Planned | Native Android apps |

## Web Components (Lit)

The **Lit renderer** provides framework-agnostic web components that work anywhere.

### Installation

```bash
npm install @a2ui/renderer-lit
```

### Basic Setup

```typescript
import { A2UIRenderer } from '@a2ui/renderer-lit';

// Create a renderer instance
const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  onAction: (action) => {
    console.log('User action:', action);
    // Send action to your agent
  }
});

// Handle incoming A2UI messages
function handleMessage(message) {
  renderer.processMessage(message);
}

// Example: Connect to SSE stream
const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};
```

### Full Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>A2UI Demo</title>
</head>
<body>
  <div id="app"></div>

  <script type="module">
    import { A2UIRenderer } from '@a2ui/renderer-lit';

    const renderer = new A2UIRenderer({
      container: document.getElementById('app'),
      onAction: async (action) => {
        // Send action to backend
        await fetch('/api/actions', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(action)
        });
      }
    });

    // Connect to server stream
    const eventSource = new EventSource('/api/a2ui-stream');
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      renderer.processMessage(message);
    };
  </script>
</body>
</html>
```

### Configuration Options

```typescript
const renderer = new A2UIRenderer({
  // Required
  container: HTMLElement,

  // Optional
  onAction: (action) => void,          // User action callback
  onError: (error) => void,            // Error handler
  theme: 'light' | 'dark' | 'auto',   // Theme preference
  customComponents: Map<string, any>,  // Custom component registry
});
```

## Angular

The **Angular renderer** provides native Angular components for seamless integration.

### Installation

```bash
npm install @a2ui/renderer-angular
```

### Module Setup

Add the A2UI module to your Angular application:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { A2UIModule } from '@a2ui/renderer-angular';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    A2UIModule.forRoot({
      // Optional configuration
      theme: 'auto',
      customComponents: []
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### Component Usage

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { A2UIService } from '@a2ui/renderer-angular';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <a2ui-renderer
        [surfaceId]="'main'"
        (action)="handleAction($event)">
      </a2ui-renderer>
    </div>
  `
})
export class AppComponent implements OnInit {
  constructor(private a2ui: A2UIService) {}

  ngOnInit() {
    // Connect to message stream
    const eventSource = new EventSource('/api/a2ui-stream');
    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.a2ui.processMessage(message);
    };
  }

  handleAction(action: any) {
    console.log('User action:', action);
    // Send to your backend
  }
}
```

### Service API

```typescript
import { A2UIService } from '@a2ui/renderer-angular';

@Component({/*...*/})
export class MyComponent {
  constructor(private a2ui: A2UIService) {}

  ngOnInit() {
    // Process messages
    this.a2ui.processMessage(message);

    // Get surface state
    const surface = this.a2ui.getSurface('main');

    // Subscribe to data model changes
    this.a2ui.dataModel$('main').subscribe(data => {
      console.log('Data updated:', data);
    });

    // Subscribe to actions
    this.a2ui.actions$().subscribe(action => {
      console.log('Action:', action);
    });
  }
}
```

## Flutter (GenUI SDK)

For Flutter applications, use the **GenUI SDK**, which uses A2UI under the covers.

### Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_genui: ^0.1.0
```

### Basic Setup

```dart
import 'package:flutter/material.dart';
import 'package:flutter_genui/flutter_genui.dart';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: GenUIScreen(
        agentUrl: 'https://your-agent-endpoint.com',
        onAction: (action) {
          print('User action: $action');
        },
      ),
    );
  }
}
```

### Documentation

For complete Flutter integration, see:

- [GenUI SDK Documentation](https://docs.flutter.dev/ai/genui)
- [GenUI SDK on GitHub](https://github.com/flutter/genui)
- [Verdure Example (Client-Server)](https://github.com/flutter/genui/tree/main/examples/verdure)

## Connecting to Agents

### Option 1: Server-Sent Events (SSE)

Recommended for web applications. Simple, unidirectional streaming from server to client.

**Client:**

```typescript
const eventSource = new EventSource('/api/a2ui-stream');
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  renderer.processMessage(message);
};
```

**Server (Python):**

```python
from flask import Flask, Response
import json

app = Flask(__name__)

@app.route('/api/a2ui-stream')
def a2ui_stream():
    def generate():
        # Create surface
        yield f"data: {json.dumps({'createSurface': {'surfaceId': 'main'}})}\n\n"

        # Update components
        yield f"data: {json.dumps({'updateComponents': {...}})}\n\n"

    return Response(generate(), mimetype='text/event-stream')
```

### Option 2: WebSockets

For bidirectional communication and real-time updates.

**Client:**

```typescript
const ws = new WebSocket('wss://your-server.com/a2ui');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  renderer.processMessage(message);
};

// Send actions back to server
function sendAction(action) {
  ws.send(JSON.stringify(action));
}
```

**Server (Python with FastAPI):**

```python
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/a2ui")
async def a2ui_websocket(websocket: WebSocket):
    await websocket.accept()

    # Send initial UI
    await websocket.send_json({
        "createSurface": {"surfaceId": "main"}
    })

    # Listen for actions
    while True:
        action = await websocket.receive_json()
        # Process action and send updates
```

### Option 3: A2A Protocol

For multi-agent systems, use the A2A protocol to transport A2UI messages.

```typescript
import { A2AClient } from '@a2a/client';

const client = new A2AClient({
  agentUrl: 'https://your-a2a-agent.com'
});

client.on('artifact', (artifact) => {
  if (artifact.type === 'application/a2ui+jsonl') {
    // Parse JSONL content
    const lines = artifact.content.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const message = JSON.parse(line);
        renderer.processMessage(message);
      }
    });
  }
});

await client.connect();
```

## Handling User Actions

When users interact with components (button clicks, form inputs, etc.), the renderer emits actions.

### Action Structure

```typescript
{
  surfaceId: "main",
  actionId: "submit_form",
  data: {
    // Optional action data
  }
}
```

### Sending Actions to Agent

```typescript
const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  onAction: async (action) => {
    // Send to your agent via HTTP
    const response = await fetch('/api/actions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(action)
    });

    // Agent might respond with new A2UI messages
    const messages = await response.json();
    messages.forEach(msg => renderer.processMessage(msg));
  }
});
```

## Error Handling

### Client-Side Validation

The renderer validates messages against the A2UI schema:

```typescript
const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  onError: (error) => {
    console.error('A2UI Error:', error);

    // Optionally send errors back to agent for correction
    if (error.type === 'VALIDATION_FAILED') {
      fetch('/api/errors', {
        method: 'POST',
        body: JSON.stringify({
          message: error.message,
          invalidMessage: error.data
        })
      });
    }
  }
});
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `INVALID_SURFACE_ID` | Surface doesn't exist | Ensure `createSurface` is sent first |
| `INVALID_COMPONENT_ID` | Component not found | Check component IDs are unique and defined |
| `INVALID_PATH` | Data path doesn't exist | Verify data model structure |
| `SCHEMA_VALIDATION_FAILED` | Message doesn't match schema | Check message format against spec |

## Next Steps

- **[Theming & Styling](theming.md)**: Customize the look and feel
- **[Custom Components](custom-components.md)**: Extend the component catalog
- **[Agent Development](agent-development.md)**: Build agents that generate A2UI
- **[Reference Documentation](../reference/protocol.md)**: Deep dive into the protocol
