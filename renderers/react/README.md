# @a2ui/react

React renderer for A2UI (Agent-to-User Interface) - enables AI agents to generate rich, interactive user interfaces through declarative JSON.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Components](#components)
- [Hooks](#hooks)
- [Theme System](#theme-system)
- [Component Registry](#component-registry)
- [Styles](#styles)
- [Development](#development)
- [Visual Parity Testing](#visual-parity-testing)
- [API Reference](#api-reference)
- [Contributing](#contributing)

## Installation

```bash
npm install @a2ui/react
```

**Peer Dependencies:**
- React 18.x or 19.x
- React DOM 18.x or 19.x

## Quick Start

```tsx
import { A2UIProvider, A2UIRenderer, injectStyles } from '@a2ui/react';
import { useA2UI } from '@a2ui/react';

// Inject A2UI styles once at app startup
injectStyles();

function App() {
  const { processMessages } = useA2UI();

  // Process A2UI messages from your AI agent
  const handleAgentResponse = (messages) => {
    processMessages(messages);
  };

  return (
    <A2UIProvider onAction={handleAction}>
      <A2UIRenderer surfaceId="main" />
    </A2UIProvider>
  );
}

// Handle user interactions
function handleAction(message) {
  console.log('User action:', message);
  // Send to your AI agent backend
}
```

### Standalone Viewer

For simpler use cases, use the all-in-one `A2UIViewer`:

```tsx
import { A2UIViewer, injectStyles } from '@a2ui/react';

injectStyles();

function App() {
  const messages = [...]; // A2UI messages from agent

  return (
    <A2UIViewer
      messages={messages}
      onAction={(msg) => console.log('Action:', msg)}
    />
  );
}
```

## Architecture

### Two-Context Pattern

The React renderer uses a two-context architecture for optimal performance:

```
┌─────────────────────────────────────────────────────────┐
│                     A2UIProvider                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  A2UIActionsContext │  │   A2UIStateContext      │   │
│  │  (stable reference) │  │   (triggers re-renders) │   │
│  │                     │  │                         │   │
│  │  • processMessages  │  │   • version             │   │
│  │  • setData          │  │                         │   │
│  │  • dispatch         │  │                         │   │
│  │  • getData          │  │                         │   │
│  │  • getSurface       │  │                         │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                   ThemeProvider                     │ │
│  │                                                     │ │
│  │   ┌─────────────┐    ┌─────────────────────────┐   │ │
│  │   │ A2UIRenderer│───▶│     ComponentNode       │   │ │
│  │   │ (surfaceId) │    │  (recursive rendering)  │   │ │
│  │   └─────────────┘    └─────────────────────────┘   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Why two contexts?**

- **A2UIActionsContext**: Contains stable action callbacks that never change reference. Components using `useA2UIActions()` won't re-render when data changes.
- **A2UIStateContext**: Contains a version counter that increments on state changes. Only components that need to react to data changes subscribe to this.

This separation prevents unnecessary re-renders and provides fine-grained control over component updates.

### Data Flow

```
Agent Server                    React App
     │                              │
     │  ServerToClientMessage[]     │
     ├─────────────────────────────▶│ processMessages()
     │                              │
     │                              ▼
     │                     ┌────────────────┐
     │                     │ MessageProcessor│
     │                     │   (surfaces)   │
     │                     └───────┬────────┘
     │                             │
     │                             ▼
     │                     ┌────────────────┐
     │                     │  A2UIRenderer  │
     │                     │  (per surface) │
     │                     └───────┬────────┘
     │                             │
     │                             ▼
     │                     ┌────────────────┐
     │                     │ ComponentNode  │
     │                     │  (recursive)   │
     │                     └───────┬────────┘
     │                             │
     │  A2UIClientEventMessage     │ User interaction
     │◀────────────────────────────┤ dispatch()
     │                              │
```

## Components

All components are wrapped with `React.memo()` for performance optimization.

### Content Components

| Component | Description |
|-----------|-------------|
| `Text` | Renders text with markdown support |
| `Image` | Displays images with various usage hints |
| `Icon` | Renders Material Symbols icons |
| `Divider` | Horizontal or vertical divider |
| `Video` | Video player |
| `AudioPlayer` | Audio player |

### Layout Components

| Component | Description |
|-----------|-------------|
| `Column` | Vertical flex container |
| `Row` | Horizontal flex container |
| `Card` | Card container with styling |
| `List` | List container (vertical/horizontal) |
| `Tabs` | Tabbed interface |
| `Modal` | Modal dialog |

### Interactive Components

| Component | Description |
|-----------|-------------|
| `Button` | Clickable button with action dispatch |
| `TextField` | Text input (single/multiline) |
| `CheckBox` | Checkbox input |
| `Slider` | Range slider |
| `DateTimeInput` | Date/time picker |
| `MultipleChoice` | Radio/checkbox group |

### Component Structure

Each component mirrors the Lit renderer's Shadow DOM structure for visual parity:

```tsx
// React component structure
<div className="a2ui-{component}">    {/* :host equivalent */}
  <section className="theme-classes"> {/* internal element */}
    {children}                        {/* ::slotted(*) equivalent */}
  </section>
</div>
```

## Hooks

### useA2UI()

High-level hook for external application use:

```tsx
import { useA2UI } from '@a2ui/react';

function MyComponent() {
  const { processMessages, clearSurfaces } = useA2UI();

  const loadUI = async () => {
    const response = await fetch('/api/agent');
    const messages = await response.json();
    processMessages(messages);
  };

  return <button onClick={loadUI}>Load UI</button>;
}
```

### useA2UIActions()

Access stable actions without triggering re-renders:

```tsx
import { useA2UIActions } from '@a2ui/react';

function ActionButton() {
  const { dispatch } = useA2UIActions();

  const handleClick = () => {
    dispatch({
      event: { action: { name: 'submit' } },
      sourceComponent: 'button-1',
      surfaceId: 'main',
    });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### useA2UIState()

Subscribe to state changes (triggers re-renders):

```tsx
import { useA2UIState } from '@a2ui/react';

function VersionDisplay() {
  const { version } = useA2UIState();
  return <span>State version: {version}</span>;
}
```

### useA2UIContext()

Combined access to actions and state:

```tsx
import { useA2UIContext } from '@a2ui/react';

function MyComponent() {
  const { processMessages, dispatch, version } = useA2UIContext();
  // ...
}
```

### useA2UIComponent()

Internal hook for component implementations. Automatically subscribes to state changes so components with path bindings re-render when data updates.

```tsx
import { useA2UIComponent } from '@a2ui/react';

function CustomComponent({ node, surfaceId }) {
  const {
    theme,
    resolveString,
    resolveNumber,
    resolveBoolean,
    setValue,
    getValue,
    sendAction,
    getUniqueId,
  } = useA2UIComponent(node, surfaceId);

  const text = resolveString(node.properties.text);
  // ...
}
```

**Path Binding Reactivity**: When a component uses `setValue()` to update the data model, all components reading from the same path via `resolveString()`, `resolveNumber()`, or `resolveBoolean()` will automatically re-render with the new value.

## Theme System

### Using the Default Theme

```tsx
import { A2UIProvider, litTheme } from '@a2ui/react';

<A2UIProvider theme={litTheme}>
  {/* components */}
</A2UIProvider>
```

### Creating a Custom Theme

```tsx
import { litTheme } from '@a2ui/react';

const customTheme = {
  ...litTheme,
  components: {
    ...litTheme.components,
    Button: {
      ...litTheme.components.Button,
      all: {
        'my-button-class': true,
        'rounded-lg': true,
      },
    },
  },
};

<A2UIProvider theme={customTheme}>
  {/* components */}
</A2UIProvider>
```

### Theme Structure

```typescript
interface Theme {
  components: {
    [ComponentName]: {
      all: ClassMap;        // Always applied
      [variant]: ClassMap;  // Variant-specific (e.g., primary, secondary)
    };
  };
  elements: {
    [elementName]: ClassMap; // HTML element styling
  };
  markdown: {
    [tagName]: string[];    // Markdown element classes
  };
  additionalStyles?: {
    [ComponentName]: Record<string, string>; // Inline styles
  };
}
```

## Component Registry

### Default Catalog

The default catalog registers all standard A2UI components:

```tsx
import { initializeDefaultCatalog } from '@a2ui/react';

// Call once at app startup
initializeDefaultCatalog();
```

### Custom Components

Register custom components to extend or override the default catalog:

```tsx
import { ComponentRegistry } from '@a2ui/react';

// Get the singleton registry
const registry = ComponentRegistry.getInstance();

// Register a custom component
registry.register('CustomButton', {
  component: MyCustomButton,
});

// Override an existing component
registry.register('Button', {
  component: MyEnhancedButton,
});
```

### Lazy Loading

Components can be lazy-loaded for code splitting:

```tsx
registry.register('HeavyChart', {
  component: () => import('./components/HeavyChart'),
  lazy: true,
});
```

> **Note:** Small, commonly-used components (like Tabs, Modal) should be statically imported to avoid Vite cache issues during development.

## Styles

### Injecting Styles

Inject A2UI structural and component styles once at app startup:

```tsx
import { injectStyles } from '@a2ui/react/styles';

// In your app entry point
injectStyles();
```

### Style Architecture

The styles module provides:

- **structuralStyles**: Utility classes from Lit renderer (layout-*, typography-*, color-*)
- **componentSpecificStyles**: CSS that replicates Lit's Shadow DOM scoped styles

```typescript
import { structuralStyles, componentSpecificStyles } from '@a2ui/react/styles';
```

### CSS Variables

CSS color variables must be defined by the host application:

```css
:root {
  --n-0: #ffffff;
  --n-100: #f5f5f5;
  /* ... other palette variables */
  --p-500: #3b82f6;
  /* ... */
}
```

### Removing Styles

For cleanup (e.g., in tests):

```tsx
import { removeStyles } from '@a2ui/react/styles';

removeStyles();
```

## Development

### Setup

```bash
cd renderers/react
npm install
```

### Build

```bash
npm run build    # Build the package
npm run dev      # Watch mode
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

## Testing

### Unit Tests

Uses [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

**Structure:**
```
tests/
├── setup.ts          # Initializes component catalog
├── helpers.tsx       # TestWrapper, TestRenderer, message creators
└── components/       # Component tests (*.test.tsx)
```

**Example:**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TestWrapper, TestRenderer, createSimpleMessages } from '../helpers';

it('should dispatch action on click', () => {
  const onAction = vi.fn();
  const messages = createSimpleMessages('btn-1', 'Button', {
    child: 'text-1',
    action: { name: 'submit' },
  });

  render(
    <TestWrapper onAction={onAction}>
      <TestRenderer messages={messages} />
    </TestWrapper>
  );

  fireEvent.click(screen.getByRole('button'));
  expect(onAction).toHaveBeenCalled();
});
```

## Visual Parity Testing

The React renderer maintains visual parity with the Lit renderer (reference implementation). A comprehensive test suite compares pixel-perfect screenshots between both renderers.

### Running Visual Parity Tests

```bash
cd visual-parity
npm install
npm test
```

### Quick Commands

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- --grep "button"

# Run with UI mode
npm run test:ui

# Start dev servers for manual inspection
npm run dev
# React: http://localhost:5001
# Lit: http://localhost:5002
```

### Documentation

- **[visual-parity/README.md](./visual-parity/README.md)** - Test suite usage and fixture creation
- **[visual-parity/PARITY.md](./visual-parity/PARITY.md)** - CSS transformation approach and implementation status

### Key Concepts

1. **Structural Mirroring**: React components mirror Lit's Shadow DOM structure
2. **CSS Selector Transformation**: `:host` → `.a2ui-surface .a2ui-{component}`
3. **Specificity Matching**: Uses `:where()` to match Lit's low specificity

## API Reference

### Core Exports

```typescript
// Provider and Renderer
export { A2UIProvider, A2UIRenderer, A2UIViewer, ComponentNode };

// Hooks
export { useA2UI, useA2UIActions, useA2UIState, useA2UIContext, useA2UIComponent };

// Registry
export { ComponentRegistry, registerDefaultCatalog, initializeDefaultCatalog };

// Theme
export { ThemeProvider, useTheme, litTheme, defaultTheme };

// Styles (from '@a2ui/react/styles')
export { injectStyles, removeStyles, structuralStyles, componentSpecificStyles };

// Utilities
export { cn, classMapToString, stylesToObject };

// All component exports
export { Text, Image, Icon, Divider, Video, AudioPlayer };
export { Row, Column, Card, List, Tabs, Modal };
export { Button, TextField, CheckBox, Slider, DateTimeInput, MultipleChoice };
```

### Types

```typescript
import type {
  Types,
  Theme,
  Surface,
  SurfaceID,
  AnyComponentNode,
  ServerToClientMessage,
  A2UIClientEventMessage,
  A2UIComponentProps,
  A2UIProviderProps,
  A2UIRendererProps,
  UseA2UIResult,
  UseA2UIComponentResult,
} from '@a2ui/react';
```

## Contributing

### Code Style

- All components use `React.memo()` for performance
- Use the two-context pattern for state management
- Follow the existing component structure for visual parity

### Adding a New Component

1. Create component in `src/components/{category}/{ComponentName}.tsx`
2. Follow wrapper div + section structure (see [Component Structure](#component-structure))
3. Register in `src/registry/defaultCatalog.ts`
4. Export from `src/index.ts`
5. Add unit tests in `tests/components/{ComponentName}.test.tsx`
6. Add visual parity fixtures in `visual-parity/fixtures/components/`
