# @a2ui/react_prototype

A2UI Renderer for React. This library provides components and adapters for rendering A2UI (Agent to User Interface) surfaces in React applications.

## Installation

```bash
npm install @a2ui/react_prototype @a2ui/web_core react react-dom zod rxjs
```

## Key Components

- `A2uiSurface`: The main component for rendering an A2UI surface.
- `createReactComponent`: An adapter for creating React-specific A2UI components.
- `minimalCatalog`: A pre-configured catalog for the minimal set of A2UI components.

## Development

To build the library:

```bash
npm run build
```

To run tests:

```bash
npm test
```

## Related Projects

- `@a2ui/web_core`: The core agnostic logic for A2UI.
- `samples/client/react`: A gallery application for testing and debugging this renderer.
