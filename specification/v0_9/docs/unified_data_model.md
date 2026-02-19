# Unified Data Model Architecture

This document describes the architecture of the A2UI client-side data model. The design separates concerns into three distinct layers: a persistent "dumb" data layer, a processing layer that handles protocol logic, and a transient context layer that facilitates rendering.

## Architectural Layers

### 1. The Processing Layer (`A2uiMessageProcessor`)

The **Processing Layer** is the entry point for the system. It is responsible for bridging the gap between the wire protocol (JSON messages) and the internal object model.

*   **Role:** It acts as the "Controller." It accepts the raw stream of A2UI messages (`createSurface`, `updateComponents`, etc.), parses them, and mutates the underlying Data Layer accordingly.
*   **State:** It owns the root `SurfaceGroupModel`.
*   **Logic:** It handles the complexity of the protocol, such as routing messages to the correct surface, validating schema references, and instantiating model objects.

```typescript
class A2uiMessageProcessor<T extends CatalogApi> {
  readonly model: SurfaceGroupModel<T>; // Root state container for all surfaces
  
  constructor(catalogs: T[], actionHandler: ActionListener);

  processMessages(messages: any[]): void; // Ingests raw JSON message stream
  getSurfaceModel(id: string): SurfaceModel<T> | undefined; // Access specific surface state
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void; // Watch for surface lifecycle
  getClientCapabilities(options?: CapabilitiesOptions): any; // Generate advertising payload
}
```

### 2. The Data Layer (The "Dumb" Models)

The **Data Layer** consists of long-lived, mutable state objects. These classes are designed to be "dumb containers" for data. They hold the state of the UI but contain minimal logic. They are organized hierarchically and use a consistent pattern for observability and composition.

**Key Characteristics:**
*   **Mutable:** State is updated in place.
*   **Observable:** Each layer is responsible for making its direct properties observable via standard listener patterns (callbacks), avoiding heavy reactive dependencies.
*   **Encapsulated Composition:** Parent layers expose methods to add fully-formed child instances (e.g., `addSurface`, `addComponent`) rather than factory methods that take parameters. This ensures the parent doesn't need to know how to construct its children, decoupling the layers.

#### `SurfaceGroupModel`
The root container for all active surfaces.

```typescript
interface SurfaceLifecycleListener<T extends CatalogApi> {
  onSurfaceCreated?: (s: SurfaceModel<T>) => void; // Called when a new surface is registered
  onSurfaceDeleted?: (id: string) => void; // Called when a surface is removed
}

class SurfaceGroupModel<T extends CatalogApi> {
  addSurface(surface: SurfaceModel<T>): void; // Register a new surface instance
  deleteSurface(id: string): void; // Remove surface and cleanup resources
  getSurface(id: string): SurfaceModel<T> | undefined;
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void; // Watch creation/deletion
  addActionListener(l: ActionListener): () => void; // Centralized action stream
}
```

#### `SurfaceModel`
Represents the state of a single UI surface.

```typescript
type ActionListener = (action: any) => void | Promise<void>; // Handler for user interactions

class SurfaceModel<T extends CatalogApi> {
  readonly id: string;
  readonly catalog: T; // Catalog containing framework-specific renderers
  readonly dataModel: DataModel; // Scoped application data
  readonly componentsModel: SurfaceComponentsModel; // Flat component map
  readonly theme: any; // Theme parameters from createSurface

  addActionListener(l: ActionListener): () => void; // Surface-scoped interaction events
  dispatchAction(action: any): Promise<void>; // Report event to server
  createComponentContext(id: string, basePath?: string): ComponentContext; // Bind component for UI
}
```

#### `SurfaceComponentsModel`
A flat collection of components belonging to a surface.

```typescript
interface ComponentsLifecycleListener {
  onComponentCreated: (c: ComponentModel) => void; // Called when a component is added
  onComponentDeleted?: (id: string) => void; // Called when a component is removed
}

class SurfaceComponentsModel {
  get(id: string): ComponentModel | undefined;
  addComponent(component: ComponentModel): void; // Add definition to flat map
  addLifecycleListener(l: ComponentsLifecycleListener): () => void; // Watch for tree changes
}
```

#### `ComponentModel`
Represents the configuration and properties of a specific component instance.

```typescript
interface ComponentUpdateListener {
  onComponentUpdated(c: ComponentModel): void; // Called when any property changes
}

interface AccessibilityProperties {
  label?: any; // Semantic label for screen readers
  description?: any; // Detailed accessibility description
  [key: string]: any; // Other ARIA-equivalent properties
}

class ComponentModel {
  readonly id: string;
  readonly type: string; // Component name (e.g. 'Button')
  get properties(): Record<string, any>; // Current raw JSON configuration
  get accessibility(): AccessibilityProperties | undefined;

  update(newProps: Record<string, any>): void; // Apply incremental updates
  addUpdateListener(l: ComponentUpdateListener): () => void; // Watch for config changes
}
```

#### `DataModel`
A dedicated store for the surface's application data (the "Model" in MVVM).

```typescript
class DataModel {
  get(path: string): any; // Resolve JSON Pointer to value
  set(path: string, value: any): void; // Atomic update at path
  subscribe<T>(path: string): Subscription<T>; // Reactive path monitoring
  dispose(): void; // Lifecycle cleanup
}

interface Subscription<T> {
  readonly value: T | undefined; // Latest evaluated value
  onChange?: (v: T | undefined) => void; // Fired on value change
  unsubscribe(): void; // Stop listening
}
```
### 3. The Context Layer (Transient Windows)

The **Context Layer** consists of short-lived objects created on-demand during the rendering process. They solve the problem of "scope" and binding resolution.

Because the Data Layer is "dumb" (a flat list of components and a raw data tree), it doesn't inherently know about the hierarchy or the current data scope (e.g., inside a list iteration). The Context Layer bridges this gap for the renderer.

#### `DataContext`
A window into the `DataModel` at a specific path.

```typescript
class DataContext {
  readonly path: string; // Current absolute base path
  set(path: string, value: any): void; // Mutate model at scoped path
  resolveDynamicValue<V>(v: any): V; // Evaluate path/literal/function calls
  subscribeDynamicValue<V>(v: any): Subscription<V>; // Reactive evaluation
  nested(relativePath: string): DataContext; // Create context for list items
}
```

#### `ComponentContext`
A binding object that pairs a `ComponentModel` with a `DataContext`.

```typescript
class ComponentContext {
  readonly componentModel: ComponentModel; // The instance configuration
  readonly dataContext: DataContext; // The instance's data scope
  dispatchAction(action: any): Promise<void>; // Propagate action to surface
}
```
---

## Data Representation and Observability Patterns

To ensure consistency and portability, the implementation relies on standard patterns rather than framework-specific libraries.

### 1. The "Add" Pattern for Composition
We strictly separate **construction** from **composition**. Parent containers do not act as factories for their children.

*   **Why?** This decoupling allows the child classes to evolve their constructor signatures without breaking the parent. It also simplifies testing by allowing mock children to be injected easily.
*   **Pattern:**
    ```typescript
    // Parent knows nothing about Child's constructor options
    const child = new ChildModel(config); 
    parent.addChild(child); 
    ```

### 2. Standard Observer Pattern
Observability is implemented using simple subscription functions that return an "unsubscribe" callback. This avoids the need for `RxJS` or other heavy event libraries in the core model.

*   **Pattern:**
    ```typescript
    // Subscribe
    const unsubscribe = model.addChangeListener((event) => { ... });
    
    // Unsubscribe later
    unsubscribe();
    ```
*   **Consistency:** This pattern is used uniformly across `SurfaceGroupModel` (lifecycle), `SurfaceModel` (actions), `SurfaceComponentsModel` (lifecycle), `ComponentModel` (updates), and `DataModel` (data changes).

### 3. Granular Reactivity
The model is designed to support high-performance rendering through granular updates.
*   **Structure Changes:** The `SurfaceComponentsModel` notifies when items are added/removed.
*   **Property Changes:** The `ComponentModel` notifies when its specific configuration changes.
*   **Data Changes:** The `DataModel` notifies only subscribers to the specific path that changed.

This hierarchy allows a renderer to implement "smart" updates: re-rendering the whole list only when the list structure changes, but updating just a text node when a bound string value changes.

---

# Design Options & Future Directions

## Flat vs. Hierarchical Object Model

### **A) [Implemented] Flat Component Object Model**
The `SurfaceComponentsModel` maintains a flat map of components by ID. The hierarchy is defined implicitly by `children` property references within the component properties.

*   **Pros:** Simplifies the data structure and makes "update by ID" operations O(1). Matches the wire protocol directly.
*   **Cons:** The renderer is responsible for traversing the tree by resolving ID references.

### **B) [Future] Hierarchical Object Model**
A future evolution could parse the flat list into a true object graph where parent objects hold references to child objects. This would require schema introspection to identify which properties represent relationships.

## Data Model References

### **[Implemented] Raw JSON with Helper Classes**
The `ComponentModel` stores properties as raw JSON. The `DataContext` provides the logic to interpret "Dynamic Values" (objects like `{ path: "..." }`) and resolve them to actual data.

This approach keeps the model serializable and simple while concentrating the resolution logic in the transient `DataContext`.

---

# **Extensibility and Rendering**

## **Catalog Interfaces**

The core processor uses these interfaces to manage component definitions and advertise capabilities.

```typescript
interface CatalogApi {
  id: string; // Unique catalog URI
  readonly components: ReadonlyMap<string, ComponentApi>;
}

interface ComponentApi {
  name: string; // Protocol name (e.g. 'Button')
  readonly schema: z.ZodType<any>; // Technical definition for capabilities
}
```

## **Framework-Specific Renderers**

Framework implementations (Angular, Lit, Flutter) extend the core by providing rendering logic that consumes the `ComponentContext`.

### **Framework Surface**
The entrypoint widget for a specific framework. It listens to the `SurfaceModel` to dynamically build the UI tree.

```typescript
class MyFrameworkSurface {
  constructor(model: SurfaceModel<MyFrameworkCatalog>);
  // Implementation uses model.componentsModel.addLifecycleListener to 
  // recursively render children starting from the 'root' component.
}
```

### **Framework Component Renderer**
A specific renderer for a component type.

```typescript
class MyFrameworkButtonRenderer implements ComponentApi {
  readonly name = 'Button';
  readonly schema = ButtonSchema;

  // Framework-specific render method
  render(ctx: ComponentContext): MyFrameworkWidget {
     // 1. Subscribe to ctx.componentModel.addUpdateListener for config changes
     // 2. Use ctx.dataContext.subscribeDynamicValue for data bindings
     // 3. Call ctx.dispatchAction() for user interactions
  }
}
```
