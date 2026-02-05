# @a2ui/react

A React renderer for the A2UI protocol with ShadCN-style components and Tailwind CSS.

## Installation

```bash
npm install @a2ui/react
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom tailwindcss
```

## Quick Start

### 1. Set up Tailwind CSS

Ensure your project has Tailwind CSS configured. Add the A2UI React components to your `tailwind.config.js`:

```js
module.exports = {
  content: [
    // ... your content paths
    "./node_modules/@a2ui/react/**/*.{js,ts,jsx,tsx}",
  ],
  // ... rest of config
};
```

### 2. Wrap your app with providers

```tsx
import { A2UIProvider, ThemeProvider } from "@a2ui/react";

function App() {
  const handleAction = (action) => {
    // Send action to your server
    console.log("Action:", action);
  };

  return (
    <A2UIProvider onAction={handleAction}>
      <ThemeProvider>
        <YourApp />
      </ThemeProvider>
    </A2UIProvider>
  );
}
```

### 3. Process messages and render

```tsx
import { useA2UI, A2UIRenderer } from "@a2ui/react";
import { useEffect } from "react";

function YourApp() {
  const { processMessages } = useA2UI();

  useEffect(() => {
    // Fetch A2UI messages from your server
    fetch("/api/a2ui")
      .then((res) => res.json())
      .then((messages) => processMessages(messages));
  }, [processMessages]);

  return <A2UIRenderer surfaceId="main" />;
}
```

## API Reference

### Providers

#### `<A2UIProvider>`

Main context provider for A2UI state management.

```tsx
<A2UIProvider onAction={(action) => console.log(action)}>
  {children}
</A2UIProvider>
```

Props:
- `onAction`: Callback when user triggers an action (e.g., button click)
- `children`: React children

#### `<ThemeProvider>`

Provides CSS class mappings for styling components.

```tsx
<ThemeProvider theme={customTheme}>
  {children}
</ThemeProvider>
```

Props:
- `theme`: Optional custom theme object (defaults to ShadCN-style theme)
- `children`: React children

### Hooks

#### `useA2UI()`

Main hook for interacting with A2UI.

```tsx
const {
  surfaces,          // Map of all surfaces
  getSurface,        // Get a specific surface
  processMessages,   // Process incoming A2UI messages
  sendAction,        // Send an action to the server
  getComponentTree,  // Get the root component tree for a surface
  clearSurfaces,     // Clear all surfaces
} = useA2UI();
```

#### `useDataBinding(node, surfaceId)`

Hook for resolving data bindings in custom components.

```tsx
const {
  resolveString,   // Resolve a StringValue
  resolveNumber,   // Resolve a NumberValue
  resolveBoolean,  // Resolve a BooleanValue
  setValue,        // Set a value in the data model
  getValue,        // Get a value from the data model
} = useDataBinding(node, surfaceId);
```

### Components

#### `<A2UIRenderer>`

Main renderer component that renders an entire A2UI surface.

```tsx
<A2UIRenderer
  surfaceId="main"
  className="my-surface"
  fallback={<Loading />}
/>
```

Props:
- `surfaceId`: The ID of the surface to render
- `className`: Optional CSS class for the root element
- `fallback`: Optional fallback when surface is not found

### Standard Components

All 18 standard A2UI components are implemented:

**Content:**
- `Text` - Text with markdown support and typography hints
- `Image` - Images with fit and usage hints
- `Icon` - Icons from Lucide React
- `Video` - Video player
- `AudioPlayer` - Audio player with description
- `Divider` - Horizontal/vertical separator

**Layout:**
- `Row` - Horizontal flex container
- `Column` - Vertical flex container
- `List` - Scrollable list (horizontal/vertical)
- `Card` - Card container
- `Tabs` - Tab navigation
- `Modal` - Modal dialog

**Interactive:**
- `Button` - Clickable button with action support
- `CheckBox` - Checkbox with label
- `TextField` - Text input (various types)
- `DateTimeInput` - Date/time picker
- `MultipleChoice` - Select dropdown
- `Slider` - Range slider

## Custom Theming

You can customize the appearance by providing a custom theme:

```tsx
import { ThemeProvider, defaultTheme } from "@a2ui/react";

const customTheme = {
  ...defaultTheme,
  components: {
    ...defaultTheme.components,
    Button: {
      "bg-blue-500": true,
      "text-white": true,
      "px-4": true,
      "py-2": true,
      "rounded": true,
    },
  },
};

<ThemeProvider theme={customTheme}>
  {children}
</ThemeProvider>
```

## Streaming Messages

For streaming A2UI messages (e.g., from Server-Sent Events):

```tsx
function StreamingApp() {
  const { processMessages } = useA2UI();

  useEffect(() => {
    const eventSource = new EventSource("/api/a2ui/stream");

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      processMessages([message]);
    };

    return () => eventSource.close();
  }, [processMessages]);

  return <A2UIRenderer surfaceId="main" />;
}
```

## TypeScript

This package is written in TypeScript and includes full type definitions. Types are re-exported from `@a2ui/lit`:

```tsx
import { Types, Primitives, Data } from "@a2ui/react";

// Use types
const surface: Types.Surface = ...;
const message: Types.ServerToClientMessage = ...;
```

## License

Apache-2.0
