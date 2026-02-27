# Unified Data Model Architecture

This document describes the architecture of the A2UI client-side data model. The design separates concerns into two distinct primary layers: the language-agnostic **Data Layer** (which parses messages and stores state) and the **Framework-Specific Rendering Layer** (which paints the pixels). 

Both of these architectural layers are completely agnostic to the specific components being rendered. Instead, they interact with **Catalogs**. Within a catalog, there is a similar two-layer split: the **Catalog API** defines the schema and interface, while the **Catalog Implementation** defines how to actually render those components in a specific framework.

## 1. Data Layer

The Data Layer is responsible for receiving the wire protocol (JSON messages), parsing them, and maintaining a long-lived, mutable state object. This layer follows the exact same design in all programming languages (with minor syntactical variations) and **does not require design work when porting to a new framework**. 

It consists of three sub-components: the Processing Layer, the Dumb Models, and the Context Layer.

### Key Interfaces and Classes
*   **`MessageProcessor`**: The entry point that ingests raw JSON streams.
*   **`SurfaceGroupModel`**: The root container for all active surfaces.
*   **`SurfaceModel`**: Represents the state of a single UI surface.
*   **`SurfaceComponentsModel`**: A flat collection of component configurations.
*   **`ComponentModel`**: A specific component's raw configuration.
*   **`DataModel`**: A dedicated store for application data.
*   **`DataContext`**: A scoped window into the `DataModel`.
*   **`ComponentContext`**: A binding object pairing a component with its data scope.

### The Processing Layer (`MessageProcessor`)
The **Processing Layer** acts as the "Controller." It accepts the raw stream of A2UI messages (`createSurface`, `updateComponents`, etc.), parses them, and mutates the underlying Data Models accordingly.

It also handles generating the client capabilities payload via `getClientCapabilities()`. By passing inline catalog definitions to this method, the processor can dynamically generate JSON Schemas for the supported components, allowing the agent to understand the client's available UI components on the fly.

```typescript
class MessageProcessor<T extends CatalogApi> {
  readonly model: SurfaceGroupModel<T>; // Root state container for all surfaces
  
  constructor(catalogs: T[], actionHandler: ActionListener);

  processMessages(messages: any[]): void; // Ingests raw JSON message stream
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void; // Watch for surface lifecycle
  getClientCapabilities(options?: CapabilitiesOptions): any; // Generate advertising payload
}
```

#### Generating Client Capabilities and Schema Types

To dynamically generate the `a2uiClientCapabilities` payload (specifically the `inlineCatalogs` array), the renderer needs to convert its internal component schemas into valid JSON Schemas that adhere to the A2UI protocol.

**Schema Types Location**
The foundational schema types for A2UI components are defined in the `schema` directory (e.g., `renderers/web_core/src/v0_9/schema/common-types.ts`). This is where reusable validation schemas (like Zod definitions) reside.

**Detectable Common Types**
A2UI heavily relies on shared schema definitions (like `DynamicString`, `DataBinding`, and `Action` from `common_types.json`). However, most schema validation libraries (such as Zod) do not natively support emitting external JSON Schema `$ref` pointers out-of-the-box.

To solve this, common types must be **detectable** during the JSON Schema conversion process. This is achieved by "tagging" the schemas using their `description` property (e.g., `REF:common_types.json#/$defs/DynamicString`). 

When `getClientCapabilities()` converts the internal schemas:
1. It translates the definition into a raw JSON Schema.
2. It traverses the schema tree looking for string descriptions starting with the `REF:` tag.
3. It strips the tag and replaces the entire node with a valid JSON Schema `$ref` object, preserving any actual developer descriptions using a separator token.
4. It wraps the resulting property schemas in the standard A2UI component envelope (`allOf` containing `ComponentCommon` and the component's `const` type identifier).

**The Inline Catalogs API**
By passing `{ inlineCatalogs: [myCatalog] }` to `getClientCapabilities()`, the processor:
* Iterates over all the components defined in the provided `catalog`.
* Translates their schemas into the structured format required by the A2UI specification.
* Returns a configuration object ready to be sent in the transport metadata (populating `supportedCatalogIds` and `inlineCatalogs`).

**Test Cases to Include**
When implementing or modifying the capabilities generator, you must include test cases that verify:
* **Capabilities Generation:** The output successfully includes the `inlineCatalogs` list when requested.
* **Component Envelope:** Generated schemas correctly wrap component properties in an `allOf` block referencing `common_types.json#/$defs/ComponentCommon` and correctly assert the `component` property `const` value.
* **Reference Resolution:** Properties tagged with `REF:` successfully resolve to `$ref` objects instead of expanding the inline schema definition (e.g., a `title` property correctly emits `"$ref": "common_types.json#/$defs/DynamicString"`).
* **Description Preservation:** Additional descriptions appended to tagged types are preserved and properly formatted alongside the reference pointer.

### The "Dumb" Models
These classes are designed to be "dumb containers" for data. They hold the state of the UI but contain minimal logic. They are organized hierarchically and use a consistent pattern for observability and composition.

**Key Characteristics:**
*   **Mutable:** State is updated in place.
*   **Observable:** Each layer is responsible for making its direct properties observable via standard listener patterns (callbacks), avoiding heavy reactive dependencies.
*   **Encapsulated Composition:** Parent layers expose methods to add fully-formed child instances (e.g., `addSurface`, `addComponent`) rather than factory methods that take parameters.
#### `SurfaceGroupModel` & `SurfaceModel`
The root containers for active surfaces and their catalogs, data, and components.

```typescript
interface SurfaceLifecycleListener<T extends CatalogApi> {
  onSurfaceCreated?: (s: SurfaceModel<T>) => void; // Called when a new surface is registered
  onSurfaceDeleted?: (id: string) => void; // Called when a surface is removed
}

class SurfaceGroupModel<T extends CatalogApi> {
  addSurface(surface: SurfaceModel<T>): void;
  deleteSurface(id: string): void;
  getSurface(id: string): SurfaceModel<T> | undefined;
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void;
  addActionListener(l: ActionListener): () => void;
}

type ActionListener = (action: any) => void | Promise<void>; // Handler for user interactions

class SurfaceModel<T extends CatalogApi> {
  readonly id: string;
...
  readonly catalog: T; // Catalog containing framework-specific renderers
  readonly dataModel: DataModel; // Scoped application data
  readonly componentsModel: SurfaceComponentsModel; // Flat component map
  readonly theme: any; // Theme parameters from createSurface

  addActionListener(l: ActionListener): () => void;
  dispatchAction(action: any): Promise<void>;
}
```
#### `SurfaceComponentsModel` & `ComponentModel`
Manages the raw JSON configuration of components in a flat map.

```typescript
interface ComponentsLifecycleListener {
  onComponentCreated: (c: ComponentModel) => void; // Called when a component is added
  onComponentDeleted?: (id: string) => void; // Called when a component is removed
}

class SurfaceComponentsModel {
  get(id: string): ComponentModel | undefined;
  addComponent(component: ComponentModel): void;
  addLifecycleListener(l: ComponentsLifecycleListener): () => void;
}

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
...
  readonly type: string; // Component name (e.g. 'Button')
  get properties(): Record<string, any>; // Current raw JSON configuration
  get accessibility(): AccessibilityProperties | undefined;

  update(newProps: Record<string, any>): void;
  addUpdateListener(l: ComponentUpdateListener): () => void;
}
```
#### `DataModel`
A dedicated store for the surface's application data (the "Model" in MVVM).

```typescript
interface Subscription<T> {
  readonly value: T | undefined; // Latest evaluated value
  unsubscribe(): void; // Stop listening
}

class DataModel {
  get(path: string): any; // Resolve JSON Pointer to value
...
  set(path: string, value: any): void; // Atomic update at path
  subscribe<T>(path: string, onChange: (v: T | undefined) => void): Subscription<T>; // Reactive path monitoring
  dispose(): void; // Lifecycle cleanup
}
```

### The Context Layer (Transient Windows)
The **Context Layer** consists of short-lived objects created on-demand during the rendering process to solve the problem of "scope" and binding resolution. 

Because the Data Layer is a flat list of components and a raw data tree, it doesn't inherently know about the hierarchy or the current data scope (e.g., inside a list iteration). The Context Layer bridges this gap.

#### `DataContext` & `ComponentContext`

```typescript
class DataContext {
  constructor(dataModel: DataModel, path: string);
  readonly path: string;
  set(path: string, value: any): void;
  resolveDynamicValue<V>(v: any): V;
  subscribeDynamicValue<V>(v: any, onChange: (v: V | undefined) => void): Subscription<V>;
  nested(relativePath: string): DataContext;
}

class ComponentContext {
  constructor(surface: SurfaceModel<T>, componentId: string, basePath?: string);
  readonly componentModel: ComponentModel; // The instance configuration
  readonly dataContext: DataContext; // The instance's data scope
  dispatchAction(action: any): Promise<void>; // Propagate action to surface
}
```

## 2. Framework-Specific Rendering Layer

The Framework-Specific Rendering Layer takes the structured state provided by the Data Layer and translates it into actual UI elements (DOM nodes, Flutter widgets, etc.). This layer is specific to the UI framework being used (e.g., React, Angular, Lit, Flutter) and is the primary area requiring design work when creating a new renderer.

This layer remains completely agnostic to what components are actually being rendered. It relies on the Catalog to provide the actual implementations.

### Key Interfaces and Classes
*   **`FrameworkSurface`**: The entrypoint widget for a specific framework.

### `FrameworkSurface`
The entrypoint widget for a specific framework. It listens to the `SurfaceModel` to dynamically build the UI tree.

```typescript
class MyFrameworkSurface {
  constructor(model: SurfaceModel<MyFrameworkCatalog>);
  // Implementation uses model.componentsModel.addLifecycleListener to 
  // recursively render children starting from the 'root' component.
}
```

## 3. Catalog Architecture

The previous two layers are entirely catalog-agnostic. To actually render a UI, a **Catalog** must be provided. The Catalog defines what components exist and how to render them. It is split into two layers: the API (Schema) and the Implementation.

### Key Interfaces and Classes
*   **`CatalogApi`**: Defines the unique ID and the list of supported components.
*   **`ComponentApi`**: Defines the name and schema of a specific component.
*   **`ComponentRenderer`**: The framework-specific logic for rendering a specific component (e.g. a Button).

### Catalog API (Framework Agnostic)
The Catalog API defines the schema for components and the catalog's interface. This is shared and is completely decoupled from any specific rendering framework.

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

### Catalog Implementation (Framework Specific)
The Catalog Implementation defines how to render each component defined in the API using a particular UI framework. This is where the core design work happens for individual components (`ComponentRenderer`).

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

## 4. Design alternatives

To ensure consistency and portability, the Data Layer implementation relies on standard patterns rather than framework-specific libraries.

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

# **Design alternatives**

## **Flat vs hierarchical object model**

From an application developer or catalog implementer’s perspective, the most intuitive way for the renderer object model to be constructed is as a tree, which reflects the structure of the data.

However, it’s non-trivial to implement tree construction in a catalog-agnostic way, because the catalogs don’t have standard “child” or children.

### **A) \[Recommended now\] Flat Component object model, one-pass rendering**

In this option, the SurfaceModel contains a flat list of Components which refer to each other via ID. The job of the renderer is to reference the children and construct the tree.

This is simple to implement on every platform and pushes the complexity around constructing the tree into the framework-specific layer. 

### **B) \[Future direction\] Hierarchical object model, two-pass rendering via schema introspection**

In this approach, the Object Model represents the hierarchy with actual object references. This requires the data layer to be more complex but simplifies the framework renderer.

In this approach, the core library which decodes the A2UI messages and constructs the object model needs to:

* For each Component schema in the Catalog, detect which properties are ID references.  
* When parsing data, dereference those ID properties to directly link nodes  
* Handle templated children which requires resolving data model references to find lists of data and construct a child for each list item.  
* Create an object model which is weakly typed (because different catalogs can use different names for “child”, “children” etc, yet is a full hierarchical tree.

We will pursue this approach in the future to provide a neat way for application and framework renderer logic to navigate and update the object model. We will pursue this via a codegen approach which 

## **Data model references: Raw JSON vs structured references vs resolved literal values**

### **\[Recommended\] Raw JSON**

The object model could just expose the “props” for each component as raw JSON data which the component implementation needs to interpret e.g.

```
{
   "id": "tf1",
   "component": "TextField",
   "value": { "path": "/formData/email" },
}
```

### **\[Future direction\] Structured references**

The object model includes type-safe objects to represent references to the data model.

This makes it less error prone, though there is no type safety around the exact value lookups in the example below.

```
{
   "id": "tf1",
   "component": "TextField",
   "value": DataModelReference(absolutePath: "/formData/email"),
}
```

This could provide much more safety using some kind of codegen to generate a typesafe model class that is specific to each catalog item from its schema.

```ts
// Replace this with an actual typesafe model example
class TextFieldComponentModel {
  id: String;
  component: String;
  value: LiteralOrFunctionOrReference<String>
};
```

### **Resolved literal values**

The object model could include the actual values referenced from the data model.

This would make the framework renderer simple to implement, but this option is not recommended, because it doesn’t provide a way for application logic to programmatically modify the object model, e.g. to update a data model reference.

```
{
   "id": "tf1",
   "component": "TextField",
   "value": "no-reply@somebusiness.com",
}
```
