# A2UI React Renderer Design Document

## 1. Overview
This document outlines the architecture and implementation plan for the React renderer of the A2UI (Agent to UI) protocol v0.9. The implementation follows the guidelines specified in the `renderer_guide.md`.

## 2. Key Dependency Decisions
*   **Schema Library**: `zod` (provided by `@a2ui/web_core`). We will use TypeScript for defining schemas and intersection types to enforce component API compliance.
*   **Observable/Reactive Library**: `rxjs` (provided by `@a2ui/web_core`). React 18+ provides `useSyncExternalStore`, which is the ideal hook for subscribing to external state (like RxJS Observables or our internal `EventEmitter` implementations in the Data Layer).
*   **Native UI Framework**: React (v18+).

## 3. Core Model Layer
We will strictly leverage `@a2ui/web_core` for the framework-agnostic Data Layer. This includes:
*   `MessageProcessor`
*   `SurfaceGroupModel`, `SurfaceModel`, `SurfaceComponentsModel`, `ComponentModel`
*   `DataModel`, `DataContext`, `ComponentContext`
*   `Catalog`, `ComponentApi`, `FunctionImplementation`

Our React renderer will act as the "View" layer that consumes these models.

## 4. Framework-Specific Layer (The React Bridge)

We will build an adapter layer that bridges the `web_core` data layer to React components.

### 4.1. Generic Binder Factory (`GenericBinder`)
Since TypeScript/JavaScript are dynamic, we will implement a generic binder that inspects the component's Zod schema. It will automatically traverse the component properties, resolving `DynamicValue` fields (like `DynamicString`, `DynamicBoolean`) into reactive streams using `context.dataContext.subscribeDynamicValue()`.

The `GenericBinder` will produce a single stateful stream of `ResolvedProps` which can be consumed by React. Structural properties (like `child` or `children`) will be passed through as metadata objects (e.g., `{ id, basePath }` or `Array<{id, basePath}>`) so the React adapter can recursively build children.

### 4.2. React Component Adapter (`createReactComponent`)
We will provide a Higher-Order Component (HOC) or factory function, `createReactComponent(binder, RenderComponent)`.
*   It takes a `ComponentContext`.
*   It utilizes the `GenericBinder` to subscribe to the data model.
*   It uses `useSyncExternalStore` to connect the `GenericBinder`'s reactive stream to React's rendering cycle.
*   It manages the cleanup (`dispose()`) of the binding when the React component unmounts.
*   It passes the fully resolved props (data props as native JS types, structural props as IDs) and a `buildChild(id, basePath)` helper to the stateless `RenderComponent`.

### 4.3. Surface Renderer (`A2uiSurface`)
We will create a root React component, `<A2uiSurface surface={surfaceModel} />`, which:
*   Locates the component with `id="root"`.
*   Recursively renders the tree using a component registry mapping component types (e.g., "Text", "Button") to their wrapped React implementations.

## 5. Minimal Catalog Implementation
For our initial milestone, we will target the `minimal_catalog.json` specification.

### 5.1. Core Library (Binder & APIs)
We will define the component APIs (Schemas) using Zod for the following components:
*   `Text`
*   `Row`
*   `Column`
*   `Button`
*   `TextField`

We will implement the `capitalize` function.

### 5.2. Framework Library (React UI Widgets)
We will build stateless, styled React components for the minimal catalog, wrapped using `createReactComponent`.
*   `ReactText`
*   `ReactRow`
*   `ReactColumn`
*   `ReactButton`
*   `ReactTextField`

### 5.3. Catalog Assembly
We will bundle these definitions and implementations into a `Catalog` instance that the `MessageProcessor` can use.

## 6. Milestone: Demo Application
Once the minimal catalog is complete, we will build a local demo application:
*   A standalone React app (`npm run dev` in Vite).
*   Loads JSON arrays from `minimal_catalog/examples/`.
*   Feeds them into a `MessageProcessor`.
*   Renders the resulting `SurfaceGroupModel` using `<A2uiSurface />`.
*   Includes a test for delayed `updateDataModel` messages to verify reactive updates and progressive rendering.
