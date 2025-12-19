# @a2ui/react

Production-ready React implementation of [A2UI](https://github.com/google/A2UI) - Google's declarative UI specification for AI agents.

## Status: Stable

This renderer provides complete A2UI v0.8 protocol support with:
- **Full Protocol Implementation** - All message types (beginRendering, surfaceUpdate, dataModelUpdate, deleteSurface)
- **Streaming Support** - SSE transport with automatic reconnection
- **Complete Component Catalog** - All 18 standard catalog components
- **Data Binding** - JSON Pointer (RFC 6901) path resolution
- **Theming** - Customizable colors, typography, and spacing
- **100 Tests Passing** - Unit, integration, and conformance tests

## Installation

```bash
npm install @a2ui/react
```

## Quick Start

### Option 1: Direct Rendering (Simple)

For static A2UI specs rendered directly:

```tsx
import { A2UIRoot } from '@a2ui/react';

const spec = {
  component: 'Column',
  children: [
    { component: 'Text', text: 'Hello from A2UI!', usageHint: 'h1' },
    {
      component: 'Button',
      primary: true,
      child: { component: 'Text', text: 'Click me' },
      action: { name: 'click' }
    }
  ]
};

function App() {
  const handleAction = (action) => {
    console.log('Action:', action);
  };

  return <A2UIRoot spec={spec} data={{}} onAction={handleAction} />;
}
```

### Option 2: Streaming Protocol (Full)

For the complete A2UI streaming protocol with incremental updates:

```tsx
import { MessageProcessor, A2UISurface } from '@a2ui/react';

// Create a processor to handle A2UI messages
const processor = new MessageProcessor();

function App() {
  const handleAction = (action) => {
    console.log('Action:', action.action.name, action.action.context);
  };

  return (
    <A2UISurface
      surfaceId="my-surface"
      processor={processor}
      onAction={handleAction}
    />
  );
}

// Process A2UI messages from your agent
processor.processMessage({
  type: 'beginRendering',
  surfaceId: 'my-surface',
  root: 'root',
});

processor.processMessage({
  type: 'surfaceUpdate',
  surfaceId: 'my-surface',
  components: [
    { id: 'root', component: { Text: { text: 'Hello from A2UI!' } } },
  ],
});
```

### Option 3: SSE Transport (End-to-End)

Connect directly to an A2UI-compatible server:

```tsx
import { SSETransport, MessageProcessor, A2UISurface } from '@a2ui/react';

const transport = new SSETransport({
  reconnect: true,
  maxReconnectAttempts: 5,
});

const processor = new MessageProcessor();

// Connect transport to processor
transport.onMessage((msg) => processor.processMessage(msg));

function App() {
  useEffect(() => {
    transport.connect('/api/a2ui/stream');
    return () => transport.disconnect();
  }, []);

  return <A2UISurface surfaceId="main" processor={processor} />;
}
```

## Components

All A2UI v0.8 standard catalog components are implemented:

| Category | Components |
|----------|------------|
| **Display** | `Text`, `Image`, `Icon`, `Video`, `AudioPlayer` |
| **Layout** | `Row`, `Column`, `List`, `Card`, `Tabs`, `Divider`, `Modal` |
| **Interactive** | `Button`, `CheckBox`, `TextField`, `Slider`, `DateTimeInput`, `ChoicePicker` |

## Architecture

```
┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐
│  Transport  │───▶│ MessageProcessor │───▶│    A2UISurface    │
│   (SSE)     │    │  (State Machine) │    │   (Renderer)      │
└─────────────┘    └─────────────────┘    └───────────────────┘
       │                    │                       │
       │                    ▼                       ▼
       │           ┌───────────────┐       ┌───────────────┐
       │           │  Surface Map  │       │   Components  │
       │           │  + Data Model │       │   (Pure React) │
       │           └───────────────┘       └───────────────┘
       │                                           │
       │                    ┌───────────────────────
       │                    ▼
       │           ┌───────────────┐
       └──────────▶│ CatalogRegistry│
                   └───────────────┘
```

### Key Components

- **MessageProcessor** - Central state machine that processes incoming A2UI protocol messages
- **SSETransport** - Server-Sent Events transport with reconnection and JSONL parsing
- **A2UISurface** - Renders a surface from the processor's adjacency-list format
- **CatalogRegistry** - Version-aware component registry (v0.8, v0.9 support)

## Data Binding

Use path references to bind to runtime data:

```tsx
// Direct rendering
const spec = {
  component: 'Text',
  text: { path: 'user.name' }  // Binds to data.user.name
};

<A2UIRoot spec={spec} data={{ user: { name: 'Alice' } }} />
```

For the streaming protocol, use JSON Pointer (RFC 6901) syntax:

```tsx
processor.processMessage({
  type: 'surfaceUpdate',
  surfaceId: 'surface-1',
  components: [
    { id: 'greeting', component: { Text: { text: { path: '/user/name' } } } },
  ],
});

processor.processMessage({
  type: 'dataModelUpdate',
  surfaceId: 'surface-1',
  contents: [
    { key: 'user', valueMap: [{ key: 'name', valueString: 'Alice' }] },
  ],
});
```

## Theming

Customize colors, typography, and spacing:

```tsx
<A2UIRoot
  spec={spec}
  theme={{
    colors: {
      primary: '#6200ee',
      secondary: '#03dac6',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#212121',
    },
    borderRadius: 8,
  }}
  mode="light"  // or "dark"
/>
```

## API Reference

### MessageProcessor

```typescript
const processor = new MessageProcessor();

// Process incoming A2UI messages
processor.processMessage(message);

// Get surface state
const surface = processor.getSurface('surface-id');

// Get all surface IDs
const ids = processor.getSurfaceIds();

// Subscribe to changes
const unsubscribe = processor.subscribe((surfaceId) => {
  console.log('Surface updated:', surfaceId);
});
```

### SSETransport

```typescript
const transport = new SSETransport({
  reconnect: true,
  reconnectDelay: 1000,
  maxReconnectAttempts: 5,
  actionEndpoint: '/api/actions',  // Optional: for sending actions back
});

await transport.connect(url);
transport.onMessage(handler);
transport.onStatusChange(handler);  // 'connecting' | 'connected' | 'disconnected' | 'error'
transport.onError(handler);
await transport.sendAction(action);
transport.disconnect();
```

### A2UISurface

| Prop | Type | Description |
|------|------|-------------|
| `surfaceId` | `string` | Required: Surface identifier |
| `processor` | `MessageProcessor` | Optional: Custom processor instance |
| `onAction` | `(action: A2UIClientAction) => void` | Action handler |
| `theme` | `Partial<A2UITheme>` | Theme overrides |
| `mode` | `'light' \| 'dark'` | Color mode |
| `showLoading` | `boolean` | Show loading state while buffering |

### A2UIMultiSurface

Renders all surfaces from a processor:

```tsx
<A2UIMultiSurface
  processor={processor}
  onAction={handleAction}
  direction="column"
  gap={16}
/>
```

## Security Considerations

When integrating with external AI agents:

- Treat all agent data as **untrusted input**
- Validate and sanitize incoming specifications
- Use Content Security Policies (CSP)
- Sandbox rendered content appropriately
- Be aware of potential XSS, UI spoofing, and prompt injection risks

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests once
npm run test:run

# Build library
npm run build

# Run with coverage
npm run test:coverage
```

## Test Coverage

- **Unit Tests** - MessageProcessor, data binding, component rendering
- **Integration Tests** - Full protocol scenarios, Japanese content support
- **Conformance Tests** - JSON Schema validation against A2UI specification

## License

Apache-2.0

## Credits

- [A2UI Specification](https://github.com/google/A2UI) by Google
