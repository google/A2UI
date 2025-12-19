# A2UI React Sample

Sample application demonstrating the `@a2ui/react` renderer.

## Features Demonstrated

1. **Direct Rendering Mode** - Render A2UI specs directly without the streaming protocol
2. **Streaming Protocol Mode** - Use MessageProcessor to handle incremental A2UI updates with data binding

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Usage

The sample shows both rendering modes:

### Direct Rendering

```tsx
import { A2UIRoot } from '@a2ui/react';

<A2UIRoot
  spec={mySpec}
  data={myData}
  onAction={handleAction}
/>
```

### Streaming Protocol

```tsx
import { MessageProcessor, A2UISurface } from '@a2ui/react';

const processor = new MessageProcessor();

// Process incoming messages
processor.processMessage({ type: 'beginRendering', ... });
processor.processMessage({ type: 'surfaceUpdate', ... });
processor.processMessage({ type: 'dataModelUpdate', ... });

<A2UISurface
  surfaceId="my-surface"
  processor={processor}
  onAction={handleAction}
/>
```

## Connecting to an Agent

To connect to a real A2UI agent, use the SSE transport:

```tsx
import { SSETransport, MessageProcessor, A2UISurface } from '@a2ui/react';

const transport = new SSETransport();
const processor = new MessageProcessor();

transport.onMessage((msg) => processor.processMessage(msg));
await transport.connect('/api/a2ui/stream');
```
