# A2UI Renderer Type System Design

This document describes the type system and architecture for A2UI web renderers. It reflects the architecture implemented in the Lit renderer (Phase 1) and outlines the plan for the Angular renderer (Phase 2).

The goal is to create a decoupled, extensible, and type-safe architecture where:
- A central, framework-agnostic `A2uiMessageProcessor` handles all protocol logic and node resolution.
- Framework-specific renderers (`@a2ui/angular`, `@a2ui/lit`) consume the resolved node tree.
- Component libraries (e.g., `@a2ui/standard-catalog`) provide framework-agnostic API definitions and framework-specific rendering implementations.

## 1. Core Concepts & Interfaces

The system is built around key interfaces defined in `@renderers/lit/src/0.8/core/types/types.ts`.

### `A2uiMessageProcessor`

The central engine. It processes raw A2UI messages, manages surface state (data models, components), and resolves the component tree.

-   **Input**: Raw JSON messages (`ServerToClientMessage`).
-   **Output**: A `Surface` object containing a fully resolved `componentTree` (`AnyResolvedNode`).
-   **Responsibility**:
    -   Resolves component IDs into actual node objects.
    -   Resolves templates (`children: { template: ... }`) into actual lists of nodes.
    -   Resolves data bindings *that define structure* (like list generation).
    -   *Does not* resolve data bindings for primitive properties (like `text: { path: ... }`)—these are resolved by the UI component at render time to allow for reactivity.

### `ComponentApi`

Defines the contract for a single component type, independent of any rendering framework.

```typescript
export interface ComponentApi<TName extends string, RNode extends BaseResolvedNode<TName>> {
  readonly name: TName;

  /**
   * Resolves raw properties from the message into the typed properties
   * required by the resolved node.
   */
  resolveProperties(
    unresolvedProperties: Record<string, unknown>,
    resolver: (value: unknown) => unknown
  ): Omit<RNode, keyof BaseResolvedNode<TName>>;
}
```

### `ResolvedNode`

Represents a node in the component tree where structural references (children) have been resolved.

```typescript
export interface BaseResolvedNode<TName extends string = string> {
  id: string;
  type: TName;
  weight: number | 'initial';
  dataContextPath?: string;
}

// Example Resolved Node
export interface ButtonNode extends BaseResolvedNode<'Button'> {
  properties: {
    child: AnyResolvedNode; // Resolved from a string ID
    action: Action;
  }
}
```

### `ComponentRenderer`

The framework-specific implementation for rendering a single component.

```typescript
export interface ComponentRenderer<RNode extends AnyResolvedNode, RenderOutput> {
  readonly componentName: RNode['type'];

  /**
   * Renders the resolved node.
   * @param node The fully resolved node.
   * @param renderChild A callback to render child nodes (used by container components).
   */
  render(
    node: RNode,
    renderChild: (child: AnyResolvedNode) => RenderOutput | null
  ): RenderOutput;
}
```

### `CatalogImplementation`

A collection of `ComponentRenderer`s. It enforces that every component in a `CatalogApi` has a corresponding renderer.

```typescript
export class CatalogImplementation<RenderOutput> {
  constructor(
    catalogApi: CatalogApi,
    renderers: ComponentRenderer<any, RenderOutput>[]
  );
  
  getRenderer(componentName: string): ComponentRenderer<any, RenderOutput> | undefined;
}
```

## 2. Phase 1: Lit Implementation (Completed)

The Lit renderer has been refactored to use this architecture.

-   **Core**: Located in `renderers/lit/src/0.8/core/`. Contains `A2uiMessageProcessor`, `types.ts`, and `standard_catalog_api/`.
-   **Lit Renderer**: `LitRenderer` extends `FrameworkRenderer<TemplateResult>`.
-   **Components**: Lit components (e.g., `a2ui-button`) accept a `node` property and a `renderChild` callback.

```typescript
// Example: Lit Button Renderer
export const litButtonRenderer: ComponentRenderer<ButtonNode, TemplateResult> = {
  componentName: 'Button',
  render(node, renderChild) {
    return html`<a2ui-button .node=${node} .renderChild=${renderChild}></a2ui-button>`;
  },
};
```

## 3. Phase 2: Angular Implementation (Plan)

The Angular renderer will be updated to align with this architecture, reusing the core logic from the Lit package (or a shared core package).

### Goals
-   Reuse `A2uiMessageProcessor` and `standard_catalog_api` from `renderers/lit/src/0.8/core`.
-   Introduce `AngularCatalogImplementation` to enforce type safety.
-   Update `DynamicComponent` and specific components to work with `ResolvedNode`.

### 3.1. Shared Core Dependencies

Angular will import the core types and logic.
*   `import { ... } from '@a2ui/lit/0.8';` (Assuming core is exported from here).

### 3.2. Updating `DynamicComponent`

The base class for Angular components will be updated to generic `ResolvedNode` types.

```typescript
// BEFORE
export abstract class DynamicComponent<T extends Types.AnyComponentNode ...> {
  readonly component = input.required<T>();
  // ...
}

// AFTER
export abstract class DynamicComponent<T extends AnyResolvedNode = AnyResolvedNode> {
  readonly node = input.required<T>(); // Renamed to match Lit/Core
  readonly renderChild = input<(node: AnyResolvedNode) => Type<any> | null>(); // Optional, mostly unused in Angular templates
  // ...
}
```

### 3.3. Adapting `ComponentRenderer` for Angular

In Angular, the "output" of a renderer is the **Component Class** (`Type<any>`) or a **Promise** of one (for lazy loading). The `ComponentRenderer` should ideally be colocated in the same file as the component it renders.

```typescript
// divider.ts
@Component({
  selector: 'a2ui-divider',
  template: '<hr [class]="theme.components.Divider" />',
})
export class Divider extends DynamicComponent<DividerNode> {}

export const angularDividerRenderer: ComponentRenderer<DividerNode, AngularRenderOutput> = {
  componentName: 'Divider',
  render: () => Divider,
};
```

**Lazy Loading Example:**

```typescript
// list.ts
@Component({ ... })
export class List extends DynamicComponent<ListNode> { ... }

export const angularListRenderer: ComponentRenderer<ListNode, AngularRenderOutput> = {
  componentName: 'List',
  render: () => List, // The central catalog can use dynamic imports to load this file
};
```

### 3.4. Updating Components

Components will be updated to accept the strongly-typed `node`.

```typescript
@Component({ ... })
export class ButtonComponent extends DynamicComponent<ButtonNode> {
  // Access properties directly from the resolved node
  protected get childNode() { return this.node().properties.child; }
}

export const angularButtonRenderer: ComponentRenderer<ButtonNode, AngularRenderOutput> = {
  componentName: 'Button',
  render: () => ButtonComponent,
};
```

### 3.5. `AngularCatalogImplementation`

The central catalog assembles these colocated renderers. For components that should be lazy-loaded, the catalog can use dynamic imports.

```typescript
// standard_catalog_implementation.ts
import { angularButtonRenderer } from './catalog/button';
import { angularDividerRenderer } from './catalog/divider';

export const standardAngularCatalogImplementation = new CatalogImplementation<AngularRenderOutput>(
  standardCatalogApi,
  [
    angularButtonRenderer,
    angularDividerRenderer,
    // For lazy loading, we might need a wrapper renderer or 
    // allow the render function to be async.
    {
      componentName: 'List',
      render: () => import('./catalog/list').then(m => m.List)
    } as ComponentRenderer<any, any>
  ]
);
```

### 3.6. Updating the `Renderer` Directive

The `Renderer` directive acts as the `FrameworkRenderer`.

```typescript
@Directive({ selector: '[a2ui-renderer]' })
export class Renderer {
  readonly node = input.required<AnyResolvedNode>();
  
  constructor(private catalogImplementation: CatalogImplementation<AngularRenderOutput>) {}

  render() {
    const node = this.node();
    const renderer = this.catalogImplementation.getRenderer(node.type);
    
    if (renderer) {
      // Call render to get the component class
      // Note: We pass a dummy renderChild because Angular templates handle recursion
      const componentClass = renderer.render(node, () => null);
      
      // Create component
      const ref = this.viewContainerRef.createComponent(componentClass);
      
      // Set inputs
      ref.setInput('node', node);
      ref.setInput('surfaceId', this.surfaceId());
      ref.setInput('processor', this.processor);
    }
  }
}
```

### 3.7. Replacement of Existing Catalog Mechanism

The new architecture **replaces** the existing `Catalog` mechanism found in `@renderers/angular/src/lib/rendering/catalog.ts` and `default.ts`.

**Key Differences & Migration:**

1.  **Removal of Manual Bindings**:
    *   **Old (`CatalogEntry`)**: Defined a `bindings` function to manually map properties from the node to component inputs (e.g., `inputBinding('text', () => node.properties.text)`).
    *   **New (`ComponentRenderer`)**: Components accept the entire resolved `node`. The manual binding logic is removed. Components access properties directly (e.g., `this.node().properties.text`).

2.  **Type Safety**:
    *   **Old (`Catalog` map)**: A simple object/map. No guarantee that all components are implemented.
    *   **New (`CatalogImplementation`)**: A class that validates at construction time that every component defined in the `CatalogApi` has a corresponding renderer.

3.  **Artifact Replacement**:
    *   `src/lib/rendering/catalog.ts` (The `Catalog` interface and InjectionToken) -> **Delete**. Replaced by `CatalogImplementation`.
    *   `src/lib/catalog/default.ts` (`DEFAULT_CATALOG`) -> **Replace** with `src/lib/standard_catalog_implementation.ts` (`standardAngularCatalogImplementation`).

## 4. Migration Steps

1.  **Core Integration**: Ensure Angular can import `A2uiMessageProcessor` and types from the updated location.
2.  **Base Class Update**: Refactor `DynamicComponent` to use `ResolvedNode` and rename input to `node`.
3.  **Component Updates**:
    *   Iterate through all components (`Button`, `Card`, `Text`, etc.).
    *   Update generic type (e.g., `DynamicComponent<ButtonNode>`).
    *   Update templates to use resolved properties (e.g., `node().properties.child` is now a node, not an ID).
    *   Ensure data binding resolution (`resolvePrimitive`) uses the `processor` and the new property structures (`StringValue`).
4.  **Catalog Definition**: Create `renderers/angular/src/lib/standard_catalog_implementation.ts` and define all `ComponentRenderer`s.
5.  **Renderer Directive**: Update to use `CatalogImplementation` and `ResolvedNode`.
6.  **Config**: Update `provideA2UI` to accept `CatalogImplementation`.

## 5. Directory Structure for Angular (Proposed)

```
renderers/angular/src/lib/
├── catalog/
│   ├── button.ts           # ButtonComponent
│   ├── card.ts             # CardComponent
│   └── ...
├── rendering/
│   ├── dynamic-component.ts # Base class
│   ├── renderer.ts          # Directive (FrameworkRenderer)
│   └── catalog-implementation.ts # Standard catalog setup
├── data/
│   └── ...                  # Re-exports or specific Angular data utilities
└── index.ts
```