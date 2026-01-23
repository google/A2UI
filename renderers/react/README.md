# @a2ui/react

React implementation of A2UI (Agent-to-User Interface).

> **Note:** This renderer is currently a work in progress.

## Installation

```bash
npm install @a2ui/react
```

## Usage

```tsx
import { A2UIProvider, A2UIRenderer } from '@a2ui/react';
import '@a2ui/react/styles/structural.css';

function App() {
  return (
    <A2UIProvider>
      <A2UIRenderer surfaceId="main" />
    </A2UIProvider>
  );
}
```

## Development

```bash
npm run build    # Build the package
npm run dev      # Watch mode
npm test         # Run tests
```
