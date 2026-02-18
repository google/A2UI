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
  // The root model state.
  readonly model: SurfaceGroupModel<T>;

  constructor(catalogs: T[], actionHandler: ActionListener);

  // Ingests raw JSON messages and applies them to the model.
  processMessages(messages: any[]): void;
  
  // Generates the client capabilities payload.
  getClientCapabilities(): any;
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
*   **Responsibilities:** Managing the list of active surfaces and propagating global events (like actions) from children.
*   **Observability:** Notifies listeners when surfaces are created or deleted (`addLifecycleListener`).
*   **Composition:** Uses `addSurface(SurfaceModel)` to accept new children.

#### `SurfaceModel`
Represents the state of a single UI surface.
*   **Responsibilities:** Holds the `DataModel` (state) and `SurfaceComponentsModel` (structure) for a specific surface. It serves as the hub for surface-scoped events.
*   **Observability:** Implements an observable pattern for user actions (`addActionListener`), allowing the application to react to events like button clicks.
*   **Composition:** Instantiated by the processor and added to the group.

#### `SurfaceComponentsModel`
A flat collection of components belonging to a surface.
*   **Responsibilities:** Storing `ComponentModel` instances indexed by ID. It enforces ID uniqueness within the surface.
*   **Observability:** Notifies listeners when components are added or removed (`addLifecycleListener`), allowing the renderer to instantiate or destroy corresponding native widgets.
*   **Composition:** Uses `addComponent(ComponentModel)` to accept new components.

#### `ComponentModel`
Represents the configuration and properties of a specific component (e.g., a Button or Text field).
*   **Responsibilities:** Stores the raw property values (e.g., `{ "text": "Hello", "color": "blue" }`) and metadata like type and ID.
*   **Observability:** Notifies listeners when its properties are updated (`addUpdateListener`). This allows individual UI widgets to re-render efficiently when their specific configuration changes.

#### `DataModel`
A dedicated store for the surface's application data (the "Model" in MVVM).
*   **Responsibilities:** JSON pointer resolution (reading/writing paths like `/user/name`) and managing subscriptions.
*   **Observability:** Allows granular subscriptions to specific data paths (`subscribe(path)`). This enables fine-grained reactivity where only the parts of the UI bound to changed data need to update.

### 3. The Context Layer (Transient Windows)

The **Context Layer** consists of short-lived objects created on-demand during the rendering process. They solve the problem of "scope" and binding resolution.

Because the Data Layer is "dumb" (a flat list of components and a raw data tree), it doesn't inherently know about the hierarchy or the current data scope (e.g., inside a list iteration). The Context Layer bridges this gap for the renderer.

#### `DataContext`
A window into the `DataModel` at a specific path.
*   **Role:** It encapsulates the current "base path" for data resolution. When rendering a list item at index 0, a `DataContext` is created with path `/items/0`.
*   **Logic:** It resolves relative paths (e.g., `name`) against its absolute base path (e.g., `/items/0/name`).

#### `ComponentContext`
A binding object that pairs a `ComponentModel` with a `DataContext`.
*   **Role:** This is the primary object passed to a renderer. It gives the renderer everything it needs to draw a specific component instance:
    1.  **The Component:** What to draw (properties).
    2.  **The Data:** Where to get values (the scoped data context).
    3.  **The Actions:** How to report interactions (a dispatch method).

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
