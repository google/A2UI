# A2UI React Native Renderer

A React Native renderer for [Google's A2UI](https://github.com/google/A2UI) declarative UI specification.

## Overview

This renderer enables A2UI-compliant agents to generate native mobile UIs on iOS and Android through React Native. It maps A2UI components to their React Native equivalents while handling streaming updates, data binding, and user interactions.

## Installation

```bash
npm install @a2ui/react-native
# or
yarn add @a2ui/react-native
```

### Peer Dependencies

This package requires React and React Native as peer dependencies:

```bash
npm install react react-native
```

## Quick Start

```tsx
import React from 'react';
import { View } from 'react-native';
import { A2UIRenderer } from '@a2ui/react-native';

const App = () => {
  // A2UI JSON from your agent
  const spec = {
    surfaceId: 'main',
    rootId: 'root',
    components: [
      { id: 'root', type: 'Column', children: ['greeting', 'action'] },
      { id: 'greeting', type: 'Text', content: 'Hello from A2UI!' },
      { id: 'action', type: 'Button', label: 'Click me', action: 'doSomething' },
    ],
  };

  const handleAction = (payload) => {
    console.log('Action:', payload.actionId);
  };

  return (
    <View style={{ flex: 1 }}>
      <A2UIRenderer spec={spec} onAction={handleAction} />
    </View>
  );
};
```

## Streaming Support

For real-time UI updates from an agent server:

```tsx
import { A2UIRenderer, useA2UIStream } from '@a2ui/react-native';

const StreamingApp = () => {
  const { spec, isLoading, error, connect, sendAction } = useA2UIStream({
    url: 'https://your-agent-server.com/stream',
    autoConnect: true,
  });

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;

  return <A2UIRenderer spec={spec} onAction={sendAction} />;
};
```

## Component Mapping

| A2UI Component | React Native | Status |
|----------------|--------------|--------|
| Text | `<Text>` | ✅ |
| Button | `<Pressable>` | ✅ |
| Image | `<Image>` | ✅ |
| Row | `<View flexDirection='row'>` | ✅ |
| Column | `<View>` | ✅ |
| Card | `<View>` with shadow | ✅ |
| List | `<FlatList>` | ✅ |
| TextField | `<TextInput>` | ✅ |
| Modal | `<Modal>` | Planned |
| Tabs | Custom | Planned |
| Slider | `<Slider>` | Planned |

## Data Binding

Components support data binding through BoundValue:

```tsx
const spec = {
  surfaceId: 'main',
  rootId: 'root',
  components: [
    {
      id: 'root',
      type: 'Text',
      content: { type: 'path', path: ['user', 'name'] },
    },
  ],
  dataModel: {
    user: { name: 'John Doe' },
  },
};
```

## API Reference

### A2UIRenderer

Main component for rendering A2UI specifications.

```tsx
interface A2UIRendererProps {
  spec?: A2UISpec;
  onAction?: (payload: ActionPayload) => void;
  customComponents?: Record<string, React.ComponentType>;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ComponentType<{ error: Error }>;
}
```

### useA2UIStream

Hook for streaming A2UI updates.

```tsx
interface UseA2UIStreamOptions {
  url: string;
  autoConnect?: boolean;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  headers?: Record<string, string>;
}

interface UseA2UIStreamResult {
  spec: A2UISpec | null;
  isLoading: boolean;
  isConnected: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAction: (payload: ActionPayload) => Promise<void>;
  reset: () => void;
}
```

## Custom Components

Override or extend built-in components:

```tsx
const MyCustomButton = ({ component, onAction }) => (
  <TouchableOpacity onPress={() => onAction({ actionId: component.action })}>
    <Text>{component.label}</Text>
  </TouchableOpacity>
);

<A2UIRenderer
  spec={spec}
  customComponents={{ Button: MyCustomButton }}
/>
```

## License

Apache-2.0 - See [LICENSE](../../LICENSE) for details.
