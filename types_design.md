# A2UI Renderer Type System Design

This document outlines a TypeScript-based type system for A2UI web renderers. The primary goal is to create a decoupled, extensible, and type-safe architecture that separates the core A2UI message processing logic from the framework-specific rendering implementations (e.g., Lit, Angular, React).

This design enables an ecosystem where:
- A central, framework-agnostic `A2uiWebRenderer` handles all protocol logic.
- Framework-specific renderers (`@a2ui/angular`, `@a2ui/lit`) consume the output of the core renderer.
- Component libraries (e.g., `@a2ui/material-catalog`) can provide framework-agnostic API definitions and framework-specific rendering implementations.

## 1. Core Concepts & Interfaces

The system is built around a few key interfaces that clearly define the responsibilities of each part of the architecture.

### `A2uiWebRenderer`

The central, framework-agnostic engine. Its role is to process raw A2UI messages, manage the state of each UI surface (data models, component definitions), and resolve the incoming data into a structured, typed, and fully-resolved node tree. It has no knowledge of how these nodes will be rendered.

```typescript
import { Signal } from '@lit-labs/preact-signals';

// Represents the state of a single UI surface, with a fully resolved node tree.
interface SurfaceState {
  surfaceId: string;
  componentTree: Signal<AnyResolvedNode | null>;
  styles: Record<string, string>;
}

// The core, framework-agnostic processor.
interface A2uiWebRenderer {
  /**
   * Processes an array of raw A2UI messages from the server.
   * This updates the internal state and triggers changes in the resolved node trees.
   */
  processMessages(messages: ServerToClientMessage[]): void;

  /**
   * Returns a map of all current UI surfaces.
   * The componentTree for each surface is a signal, allowing renderers
   * to subscribe to changes reactively.
   */
  getSurfaces(): ReadonlyMap<SurfaceID, SurfaceState>;

  /**
   * Dispatches a user action to the server.
   */
  dispatchAction(action: UserAction): Promise<void>;

  /**
   * Allows UI components to update data in the data model.
   */
  setData(dataContext: BaseResolvedNode, relativePath: string, value: unknown): void;

  /**

   * Allows UI components to get data from the data model.
   */
  getData(dataContext: BaseResolvedNode, relativePath: string): unknown;
}
```

### `ComponentApi`

Defines the contract for a single component, independent of any rendering framework. It is responsible for parsing and resolving its own properties.

```typescript
// Base interface for any resolved component node.
interface BaseResolvedNode<TName extends string> {
  id: string;
  type: TName;
  weight: number | 'initial';
  dataContextPath?: string;
}

// Union type for any possible resolved node.
type AnyResolvedNode = BaseResolvedNode<string> & {
  properties: Record<string, unknown>;
};

// Interface for a component's definition.
interface ComponentApi<
  TName extends string,
  RNode extends BaseResolvedNode<TName>
> {
  readonly name: TName;

  /**
   * Resolves the raw properties from the A2UI message into the typed
   * properties required by the final resolved node. This logic is specific
   * to each component.
   * @param unresolvedProperties The raw properties from the message.
   * @param resolver A callback provided by the A2uiWebRenderer to recursively
   *        resolve values (e.g., data bindings, child component IDs).
   * @returns The resolved properties for the node.
   */
  resolveProperties(
    unresolvedProperties: Record<string, unknown>,
    resolver: (value: unknown) => unknown
  ): Omit<RNode, keyof BaseResolvedNode<TName>>['properties'];
}
```

### `CatalogApi`

A collection of `ComponentApi` definitions. This represents a complete set of components that can be used together, like a design system (e.g., Material Design).

```typescript
type AnyComponentApi = ComponentApi<string, any>;

class CatalogApi {
  private readonly components: Map<string, AnyComponentApi>;

  constructor(components: AnyComponentApi[]) {
    this.components = new Map(components.map(c => [c.name, c]));
  }

  public get(componentName: string): AnyComponentApi | undefined {
    return this.components.get(componentName);
  }
}
```

### `ComponentRenderer`

The framework-specific implementation for rendering a single component.

```typescript
/**
 * @template RNode The specific resolved node type this component can render.
 * @template RenderOutput The output type of the rendering framework (e.g., TemplateResult for Lit, JSX.Element for React).
 */
interface ComponentRenderer<
  RNode extends AnyResolvedNode,
  RenderOutput
> {
  readonly componentName: RNode['type'];

  /**
   * Renders the resolved component node.
   * @param node The fully resolved, typed component node to render.
   * @param renderChild A function provided by the framework renderer to
   *        recursively render child nodes. Container components MUST use this.
   * @returns The framework-specific, renderable output.
   */
  render(
    node: RNode,
    renderChild: (child: AnyResolvedNode) => RenderOutput | null
  ): RenderOutput;
}
```

### `CatalogImplementation`

A framework-specific implementation of a `CatalogApi`. It maps each `ComponentApi` to its corresponding `ComponentRenderer`.

```typescript
type AnyComponentRenderer<RenderOutput> = ComponentRenderer<any, RenderOutput>;

class CatalogImplementation<RenderOutput> {
  private readonly renderers: Map<string, AnyComponentRenderer<RenderOutput>>;

  /**
   * @param catalogApi The API definition for the catalog.
   * @param renderers A list of framework-specific renderers.
   */
  constructor(catalogApi: CatalogApi, renderers: AnyComponentRenderer<RenderOutput>[]) {
    // The constructor verifies that every component in `catalogApi` has a
    // corresponding renderer provided in the `renderers` array.
    // It will throw an error if a component implementation is missing.
    this.renderers = new Map(renderers.map(r => [r.componentName, r]));

    for (const api of catalogApi['components'].values()) {
        if (!this.renderers.has(api.name)) {
            throw new Error(`Missing renderer implementation for component: ${api.name}`);
        }
    }
  }

  public getRenderer(componentName: string): AnyComponentRenderer<RenderOutput> | undefined {
    return this.renderers.get(componentName);
  }
}
```

### `FrameworkRenderer`

The top-level, framework-specific renderer that orchestrates the rendering of a complete node tree.

```typescript
class FrameworkRenderer<RenderOutput> {
  private readonly catalogImplementation: CatalogImplementation<RenderOutput>;

  constructor(catalogImplementation: CatalogImplementation<RenderOutput>) {
    this.catalogImplementation = catalogImplementation;
  }

  /**
   * Renders a resolved node from the A2uiWebRenderer into the final output.
   * This is the entry point for rendering a component tree.
   */
  public renderNode(node: AnyResolvedNode): RenderOutput | null {
    const renderer = this.catalogImplementation.getRenderer(node.type);
    if (!renderer) {
      console.warn(`No renderer found for component type: ${node.type}`);
      return null;
    }

    // The `renderChild` function passed to the component renderer is a bound
    // version of this same `renderNode` method, enabling recursion.
    return renderer.render(node, this.renderNode.bind(this));
  }
}
```

## 2. Workflow and Data Flow

1.  **Initialization**:
    *   An application creates an instance of a `CatalogApi` (e.g., `StandardCatalogApi`).
    *   It creates an instance of the central `A2uiWebRenderer`, passing it the `catalogApi`.
    *   It creates a framework-specific `CatalogImplementation` (e.g., `StandardLitCatalogImplementation`), passing it the same `catalogApi` and a list of `ComponentRenderer`s for Lit.
    *   It creates a `FrameworkRenderer` (e.g., `LitRenderer`), passing it the `catalogImplementation`.

2.  **Message Processing**:
    *   Raw A2UI messages are fed into `a2uiWebRenderer.processMessages()`.
    *   The `A2uiWebRenderer` processes the messages, updating its internal data models.
    *   When building the component tree, it uses the `ComponentApi` from the `CatalogApi` to correctly `resolveProperties` for each node.
    *   This updates the `componentTree` signal for the relevant surface.

3.  **Rendering**:
    *   A top-level UI component (e.g., a Lit `<a2ui-surface>` or an Angular `<a2ui-surface>`) listens to the `componentTree` signal from the `A2uiWebRenderer`.
    *   When the signal changes, it passes the new resolved node tree to the `frameworkRenderer.renderNode()`.
    *   The `FrameworkRenderer` recursively walks the tree, using the `CatalogImplementation` to find the right `ComponentRenderer` for each node, until the entire tree is converted into the framework's renderable format.

![Data Flow Diagram](https://i.imgur.com/your-diagram-image.png)

## 3. Satisfying Use Cases

#### Developer of a `CatalogApi`
The developer creates a new class `MyCatalogApi extends CatalogApi`, passing an array of `ComponentApi` instances to the constructor. This is a clean, framework-agnostic definition of a component library.

#### Developer of a `ComponentApi`
A developer defines a component by implementing the `ComponentApi` interface. This includes:
-   `name`: A string literal type (e.g., `'Card'`).
-   A `ResolvedNode` interface (e.g., `CardResolvedNode`).
-   `resolveProperties` method: Contains the logic to transform raw properties into the strongly-typed `CardResolvedNode.properties`, using the provided `resolver` to handle children and data bindings. This encapsulates the component's structural logic.

#### Developer of a `CatalogImplementation`
The developer gathers the required `ComponentRenderer`s for their target framework and creates an instance of `CatalogImplementation`.
-   They pass the `CatalogApi` and the array of renderers to the constructor.
-   The constructor automatically validates that an implementation exists for every component in the API, satisfying the type-safety and verification requirement.
-   Because the `FrameworkRenderer` uses a `Map` (`this.renderers.get(...)`), there is no need for a large `switch` statement.

#### Developer of a `ComponentRenderer`
An Angular developer, for example, would implement `ComponentRenderer<CardResolvedNode, AngularComponent>`.
-   The `componentName` would be `'Card'`.
-   The `render` method receives a `CardResolvedNode` object, which is fully typed and resolved.
-   To render the card's child, it calls the `renderChild(node.properties.child)` function, which recursively invokes the main `FrameworkRenderer`.
-   The method returns an Angular component, fulfilling the contract.

#### Developer of a renderer for a new rendering framework (e.g., React)
1.  **Reuse `A2uiWebRenderer`**: No changes are needed here. The developer's React application would include `@a2ui/web-renderer` as a dependency.
2.  **Create React `FrameworkRenderer`**: A `ReactRenderer` class would be created. Its `renderNode` method would return `JSX.Element`.
3.  **Create React `CatalogImplementation`**: The developer would create `ComponentRenderer` implementations for React (e.g., `ReactCardRenderer`). These would be collected into a `CatalogImplementation<JSX.Element>`.
4.  **Create React Surface Component**: A top-level `<A2UISurface>` React component would be created. It would hold the `A2uiWebRenderer` and `ReactRenderer` instances and use a hook (e.g., `useEffect` or a signal-based hook) to listen for changes to the `componentTree` signal and trigger re-renders.

## 4. Implementation in Existing and New Frameworks

### Refactoring the Lit Renderer

The current Lit renderer (`@renderers/lit/src/0.8/ui/root.ts`) has a large `renderComponentTree` method with a `switch` statement. This would be replaced:
1.  The `A2uiMessageProcessor` would evolve into the `A2uiWebRenderer`. Its `buildNodeRecursive` logic would be adapted to use the new `ComponentApi.resolveProperties` pattern.
2.  A new `LitRenderer` class (`FrameworkRenderer<TemplateResult>`) would be created.
3.  Each Lit component (`a2ui-text`, `a2ui-card`, etc.) would be wrapped in a `ComponentRenderer` implementation. For example, `LitTextRenderer`'s `render` method would return `html`<a2ui-text .node=${node}></a2ui-text>``.
4.  The `Root` element's `renderComponentTree` method would be removed. Instead, the top-level `<a2ui-surface>` component would use the `LitRenderer` to render its tree.

### Adapting the Angular Renderer

The Angular renderer is already close to this design.
1.  The `MessageProcessor` becomes the `A2uiWebRenderer`.
2.  The `Catalog` (`@renderers/angular/src/lib/rendering/catalog.ts`) concept maps directly to the `CatalogImplementation`. The existing `DEFAULT_CATALOG` would be used to create `new CatalogImplementation(standardCatalogApi, defaultRenderers)`.
3.  The `Renderer` directive (`renderer.ts`) is the `FrameworkRenderer`. Its logic for dynamically creating components remains the same.
4.  The `DynamicComponent` base class remains, providing the bridge between the A2UI world and Angular's DI and component model.

### Sketch of a React Renderer

```typescript
// --- ReactRenderer.tsx (The top-level surface component) ---
import { useSignalEffect } from '@preact/signals-react';
import { a2uiWebRenderer, reactRenderer } from './config'; // Assume these are configured

export function A2UISurface({ surfaceId }: { surfaceId: string }) {
  const [node, setNode] = useState<AnyResolvedNode | null>(null);

  useSignalEffect(() => {
    const surface = a2uiWebRenderer.getSurfaces().get(surfaceId);
    setNode(surface?.componentTree.value ?? null);
  });

  if (!node) {
    return <div>Loading...</div>;
  }

  return reactRenderer.renderNode(node);
}

// --- react-card-renderer.ts ---
import { CardResolvedNode } from '@a2ui/standard-catalog';

const ReactCardRenderer: ComponentRenderer<CardResolvedNode, JSX.Element> = {
  componentName: 'Card',
  render: (node, renderChild) => {
    // A simple div wrapper for the Card component
    return (
      <div id={node.id} className="card">
        {renderChild(node.properties.child)}
      </div>
    );
  }
};
```
