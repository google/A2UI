# Unified Data Model Architecture

This document describes the architecture of the A2UI client-side data model. The design separates concerns into two distinct primary layers: the language-agnostic **Data Layer** (which parses messages and stores state) and the **Framework-Specific Rendering Layer** (which paints the pixels). 

Both of these architectural layers are completely agnostic to the specific components being rendered. Instead, they interact with **Catalogs**. Within a catalog, there is a similar two-layer split: the **Catalog API** defines the schema and interface, while the **Catalog Implementation** defines how to actually render those components in a specific framework.

## 1. Data Layer

The Data Layer is responsible for receiving the wire protocol (JSON messages), parsing them, and maintaining a long-lived, mutable state object. This layer follows the exact same design in all programming languages (with minor syntactical variations) and **does not require design work when porting to a new framework**. 

> **Note on Language & Frameworks**: While the examples in this document are provided in TypeScript for clarity, the A2UI Data Layer is intended to be implemented in any language (e.g., Java, Python, Swift, Kotlin, Rust) and remain completely independent of any specific UI framework.

It consists of three sub-components: the Processing Layer, the Dumb Models, and the Context Layer.

### Prerequisites

To implement the Data Layer effectively, your target environment needs two foundational utilities: a Schema Library and an Observable Library.

#### 1. Schema Library
To represent and validate component and function APIs, the Data Layer requires a **Schema Library**. 

*   **Ideal Choice**: A library (like **Zod** in TypeScript or **JsonSchemaBuilder** in Flutter) that allows for programmatic definition of schemas and the ability to validate raw JSON data against those definitions.
*   **Capabilities Generation**: The library should ideally support exporting these programmatic definitions to standard JSON Schema for the `getClientCapabilities` payload.
*   **Fallback**: If no suitable programmatic library exists for the target language, raw **JSON Schema strings** or manual validation logic can be used instead.

#### 2. Observable Library
A2UI relies on a standard observer pattern to reactively update the UI when data changes. The Data Layer and client-side functions must be able to return streams or reactive variables that hold an initial value and emit subsequent updates.

*   **Requirement**: You need a reactive mechanism that acts like a "BehaviorSubject" or a stateful stream—it must have a current value available synchronously upon subscription, and notify listeners of future changes. Crucially, the subscription must provide a clear mechanism to **unsubscribe** (e.g., a `dispose()` method or a returned cleanup function) to prevent memory leaks when components are removed.
*   **Examples by Platform**:
    *   **Web (TypeScript/JavaScript)**: RxJS (`BehaviorSubject`), Signals, or a simple custom `EventEmitter` class.
    *   **Android (Kotlin)**: Kotlin Coroutines (`StateFlow`) or Android `LiveData`.
    *   **iOS (Swift)**: Combine (`CurrentValueSubject`) or SwiftUI `@Published` / `Binding`.
*   **Guidance**: If your ecosystem doesn't have a lightweight built-in option, you can easily implement a simple observer class with `subscribe` and `unsubscribe` methods, keeping external dependencies low.

### Design Principles

To ensure consistency and portability, the Data Layer implementation relies on standard patterns rather than framework-specific libraries.

#### 1. The "Add" Pattern for Composition
We strictly separate **construction** from **composition**. Parent containers do not act as factories for their children.

*   **Why?** This decoupling allows the child classes to evolve their constructor signatures without breaking the parent. It also simplifies testing by allowing mock children to be injected easily.
*   **Pattern:**
    ```typescript
    // Parent knows nothing about Child's constructor options
    const child = new ChildModel(config); 
    parent.addChild(child); 
    ```

#### 2. Standard Observer Pattern (Observability)
The models must provide a mechanism for the rendering layer to observe changes. The exact implementation should follow the preferred idioms and libraries of the target language, avoiding heavy reactive dependencies (like RxJS) in the core model.

**Principles:**
1.  **Low Dependency**: Prefer "lowest common denominator" mechanisms (like simple callbacks or delegates) over complex reactive libraries.
2.  **Multi-Cast**: The mechanism must support multiple listeners registered simultaneously.
3.  **Unsubscribe Pattern**: There MUST be a clear way (e.g., returning an "unsubscribe" callback) to stop listening and prevent memory leaks.
4.  **Payload Support**: The mechanism must communicate specific data updates (e.g., passing the updated instance) and lifecycle events.
5.  **Consistency**: This pattern is used uniformly across `SurfaceGroupModel` (lifecycle), `SurfaceModel` (actions), `SurfaceComponentsModel` (lifecycle), `ComponentModel` (updates), and `DataModel` (data changes).

In the TypeScript examples, we use a simple `EventSource` pattern with vanilla callbacks. However, other idiomatic approaches—such as `Listenable` properties, `Signals`, or `Streams`—are perfectly acceptable as long as they meet the requirements above.

#### 3. Granular Reactivity
The model is designed to support high-performance rendering through granular updates rather than full-surface refreshes.
*   **Structure Changes**: The `SurfaceComponentsModel` notifies when items are added/removed.
*   **Property Changes**: The `ComponentModel` notifies when its specific configuration changes.
*   **Data Changes**: The `DataModel` notifies only subscribers to the specific path that changed.

This hierarchy allows a renderer to implement "smart" updates: re-rendering a container only when its children list changes, but updating just a specific text node when its bound data value changes.

### Key Interfaces and Classes
*   **`MessageProcessor`**: The entry point that ingests raw JSON streams.
*   **`SurfaceGroupModel`**: The root container for all active surfaces.
*   **`SurfaceModel`**: Represents the state of a single UI surface.
*   **`SurfaceComponentsModel`**: A flat collection of component configurations.
*   **`ComponentModel`**: A specific component's raw configuration.
*   **`DataModel`**: A dedicated store for application data.
*   **`DataContext`**: A scoped window into the `DataModel`. Used by functions and components to resolve dependencies and mutate state.
*   **`ComponentContext`**: A binding object pairing a component with its data scope.

### The Catalog and Component API
The Data Layer relies on a **Catalog** to know which components and functions exist. 

```typescript
interface ComponentApi {
  name: string; // Protocol name (e.g. 'Button')
  readonly schema: z.ZodType<any>; // Technical definition for capabilities
}

/** 
 * Defines a client-side logic handler. 
 */
interface FunctionImplementation {
  readonly name: string;
  readonly description: string;
  readonly returnType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any' | 'void';
  
  /** 
   * The schema for the arguments this function accepts.
   * MUST use the same schema library as the ComponentApi to ensure consistency 
   * across the catalog. 
   * This maps directly to the `parameters` field of the `FunctionDefinition`
   * in the A2UI client capabilities schema, allowing dynamic capabilities advertising.
   */
  readonly schema: z.ZodType<any>;

  /**
   * Executes the function logic.
   * @param args The key-value pairs of arguments provided in the JSON.
   * @param context The DataContext for resolving dependencies and mutating state.
   * @returns A synchronous value or a reactive stream (e.g. Observable).
   * 
   * Rationale: The return type here should be flexible based on your language.
   * Dynamic languages (like TS/JS) can return a union type (e.g., `unknown | Observable<unknown>`) 
   * and let the framework wrap static values. Strictly typed languages (like Swift or Kotlin) 
   * might instead require this to strictly return their observable equivalent (e.g., `StateFlow<Any>`) 
   * internally wrapping static returns to avoid messy generic union types.
   */
  execute(args: Record<string, any>, context: DataContext): unknown | Observable<unknown>;
}

class Catalog<T extends ComponentApi> {
  readonly id: string; // Unique catalog URI
  readonly components: ReadonlyMap<string, T>;
  readonly functions?: ReadonlyMap<string, FunctionImplementation>;

  constructor(id: string, components: T[], functions?: FunctionImplementation[]) {
    // Initializes the read-only maps
  }
}
```

#### Function Implementation Rationale
A2UI categorizes client-side functions to balance performance and reactivity. 

**Observability Consistency**: Functions can return either a synchronous literal value (for static results) or a reactive stream (for values that change over time). The execution engine (`DataContext`) is responsible for treating these consistently by wrapping synchronous returns in static observables when evaluating reactively. 

**API Documentation**: Every function MUST include a `schema` using the same schema library selected for the Data Layer. This allows the renderer to validate function arguments at runtime and generate accurate client capabilities (`parameters` in `FunctionDefinition`) for the AI model.

**Function Categories**:
1.  **Pure Logic (Synchronous)**: Functions like `add` or `concat`. Their logic is immediate and depends only on their inputs. They typically return a static primitive value.
2.  **External State (Reactive)**: Functions like `clock()` or `networkStatus()`. These return long-lived streams that push updates to the UI independently of data model changes.
3.  **Effect Functions**: Side-effect handlers (e.g., `openUrl`, `closeModal`) that return `void`. These are typically triggered by user actions rather than interpolation.


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

#### Component Lifecycle: Update vs. Recreate
When processing `updateComponents`, the processor must handle existing IDs carefully:
*   **Property Update**: If the component `id` exists and the `type` matches the existing instance, update the `properties` record. This triggers the component's `onUpdated` event.
*   **Type Change (Re-creation)**: If the `type` in the message differs from the existing instance's type, the processor MUST remove the old component instance from the model and create a fresh one. This ensures framework renderers correctly reset their internal state and widget types.


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
*   **Observable:** Each layer is responsible for making its direct properties observable via standard listener patterns, avoiding heavy reactive dependencies.
*   **Encapsulated Composition:** Parent layers expose methods to add fully-formed child instances (e.g., `addSurface`, `addComponent`) rather than factory methods that take parameters.

#### SurfaceGroupModel & SurfaceModel
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

class ComponentModel {
  readonly id: string;
  readonly type: string; // Component name (e.g. 'Button')
  
  get properties(): Record<string, any>; // Current raw JSON configuration
  set properties(newProps: Record<string, any>);
  
  readonly onUpdated: EventSource<ComponentModel>; // Fires when any property changes
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
  set(path: string, value: any): void; // Atomic update at path
  subscribe<T>(path: string, onChange: (v: T | undefined) => void): Subscription<T>; // Reactive path monitoring
  dispose(): void; // Lifecycle cleanup
}
```

#### JSON Pointer Implementation Rules
To ensure parity across implementations, the `DataModel` must follow these rules:

**1. Auto-typing (Auto-vivification)**
When setting a value at a nested path (e.g., `/a/b/0/c`), if intermediate segments do not exist, the model must create them:
*   Look at the *next* segment in the path.
*   If the next segment is numeric (e.g., `0`, `12`), initialize the current segment as an **Array** `[]`.
*   Otherwise, initialize it as an **Object** `{}`.
*   **Error Case**: Throw an exception if an update attempts to traverse through a primitive value (e.g., setting `/a/b` when `/a` is already a string).

**2. Notification Strategy (The Bubble & Cascade)**
A change at a specific path must trigger notifications for related paths to ensure UI consistency:
*   **Exact Match**: Notify all subscribers to the modified path.
*   **Ancestor Notification (Bubble Up)**: Notify subscribers to all parent paths. For example, updating `/user/name` must notify subscribers to `/user` and `/`.
*   **Descendant Notification (Cascade Down)**: Notify subscribers to all paths nested *under* the modified path. For example, replacing the entire `/user` object must notify a subscriber to `/user/name`.

**3. Undefined Handling**
*   **Objects**: Setting a key to `undefined` should remove that key from the object.
*   **Arrays**: Setting an index to `undefined` should preserve the array's length but set that specific index to `undefined` (sparse array support).

#### Type Coercion Standards
To ensure the Data Layer behaves identically across all platforms (e.g., TypeScript, Swift, Kotlin), the following coercion rules MUST be followed when resolving dynamic values:

| Input Type                 | Target Type | Result                               |
| :------------------------- | :---------- | :----------------------------------- |
| `String` ("true", "false") | `Boolean`   | `true` or `false` (case-insensitive) |
| `Number` (non-zero)        | `Boolean`   | `true`                               |
| `Number` (0)               | `Boolean`   | `false`                              |
| `Any`                      | `String`    | Locale-neutral string representation |
| `null` / `undefined`       | `String`    | `""` (empty string)                  |
| `null` / `undefined`       | `Number`    | `0`                                  |
| `String` (numeric)         | `Number`    | Parsed numeric value or `0`          |


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
  readonly surfaceComponents: SurfaceComponentsModel; // The escape hatch
  dispatchAction(action: any): Promise<void>; // Propagate action to surface
}
```

#### Inter-Component Dependencies (The "Escape Hatch")
While A2UI components are designed to be self-contained, certain rendering logic requires knowledge of a child or sibling's properties. 

**The Weight Example**: In the standard catalog, a `Row` or `Column` container often needs to know if its children have a `weight` property to correctly apply `Flex` or `Expanded` logic in frameworks like Flutter or SwiftUI.

**Usage**: Component implementations can use `ctx.surfaceComponents` to inspect the metadata of other components in the same surface.
> **Guidance**: This pattern is generally discouraged as it increases coupling. Use it only as an essential escape hatch when a framework's layout engine cannot be satisfied by explicit component properties alone.

## 2. Framework Binding Layer

The Framework Binding Layer takes the structured state provided by the Data Layer and translates it into actual UI elements (DOM nodes, Flutter widgets, etc.). This layer provides framework-specific component implementations that extend the data layer's `ComponentApi` to include actual rendering logic.

### Key Interfaces and Classes
*   **`FrameworkSurface`**: The entrypoint widget for a specific framework.
*   **`FrameworkComponent`**: The framework-specific logic for rendering a specific component.

### `FrameworkSurface`
The entrypoint widget for a specific framework. It listens to the `SurfaceModel` to dynamically build the UI tree. It initiates the rendering loop at the component with ID `root`.

### The Rendering Pattern
How components are rendered depends on the target framework's architecture.

#### 1. Functional / Reactive Frameworks (e.g., Flutter, SwiftUI)
In frameworks that use an immutable widget tree, components typically implement a `build` or `render` method that is called whenever the component's properties or bound data change.

**Example Recursive Builder Pattern**:
```typescript
interface MyFrameworkComponent extends ComponentApi {
  /**
   * @param ctx The component's context.
   * @param buildChild A closure provided by the surface to recursively build children.
   */
  build(ctx: ComponentContext, buildChild: (id: string) => Widget): Widget;
}
```

#### 2. Stateful / Imperative Frameworks (e.g., Vanilla DOM, Android Views)
In stateful frameworks, a parent component instance might persist even as its configuration changes. In these cases, the `FrameworkComponent` might maintain a reference to its native element and provide an `update()` method to apply new properties without re-creating the entire child tree.

#### Subscription Management
Regardless of the framework paradigm (functional or stateful), the `FrameworkComponent` implementation is responsible for tracking any active subscriptions returned by the `DataContext` or `ComponentModel`. It must ensure these subscriptions are properly disposed of when the component is unmounted from the UI tree.

### Component Traits

#### Reactive Validation (`Checkable`)
Interactive components that support the `checks` property should implement the `Checkable` trait.
*   **Aggregate Error Stream**: The component should subscribe to all `CheckRule` conditions defined in its properties.
*   **UI Feedback**: It should reactively display the `message` of the first failing check as a validation error hint.
*   **Action Blocking**: Actions (like `Button` clicks) should be reactively disabled or blocked if any validation check in the surface or component fails.

#### Component Subscription Lifecycle
To ensure performance and prevent memory leaks, components MUST strictly manage their subscriptions. Follow these rules:
1.  **Lazy Subscription**: Only subscribe to data paths or property updates when the component is actually mounted/attached to the UI.
2.  **Path Stability**: If a component's property (e.g., a `value` data path) changes via an `updateComponents` message, the component MUST unsubscribe from the old path before subscribing to the new one.
3.  **Destruction / Cleanup**: When a component is removed from the UI (e.g., via a `deleteSurface` message, a conditional render, or when its parent is replaced), the framework binding MUST hook into its native lifecycle (e.g., `ngOnDestroy` in Angular, `dispose` in Flutter, `useEffect` cleanup in React, `onDisappear` in SwiftUI) to trigger unsubscription from all active data and property observables. This ensures listeners are cleared from the `DataModel`.

## **Basic Catalog Implementation**

The Standard A2UI Catalog (v0.9) requires a shared logic layer for expression resolution and standard component definitions. To maintain consistency across renderers, implementations should follow this structure:

*   **`basic_catalog_api/`**: Contains the framework-agnostic `ComponentApi` definitions for standard components (`Text`, `Button`, `Row`, etc.) and the `FunctionImplementation` definitions for standard functions.
*   **`basic_catalog_implementation/`**: Contains the framework-specific rendering logic (e.g. `SwiftUIButton`, `FlutterRow`).

### **Expression Resolution Logic (`formatString`)**
The standard `formatString` function is responsible for interpreting the `${expression}` syntax within string properties. 

**Implementation Requirements**:
1.  **Recursion**: The function implementation MUST use `DataContext.resolveDynamicValue()` or `DataContext.subscribeDynamicValue()` to recursively evaluate nested expressions or function calls (e.g., `${formatDate(value:${/date})}`).
2.  **Tokenization**: The parser must distinguish between:
    *   **DataPath**: A raw JSON Pointer (e.g., `${/user/name}`).
    *   **FunctionCall**: Identified by parentheses (e.g., `${now()}`).
3.  **Escaping**: Literal `${` sequences must be handled (typically by escaping as `\${`).
4.  **Reactive Coercion**: Results are transformed into strings using the **Type Coercion Standards** defined in the Data Layer section.

## Resources

When implementing a new rendering framework, you should definitely read the core JSON schema files for the protocol and the markdown doc in the specification. Here are the key resources:

*   **A2UI Protocol Specification:**
    *   `specification/v0_9/docs/a2ui_protocol.md`
    *   [GitHub Link](https://github.com/google/A2UI/tree/main/specification/v0_9/docs/a2ui_protocol.md)
*   **JSON Schemas:** (Core files for the protocol)
    *   `a2ui_client_capabilities.json`: [`specification/v0_9/json/a2ui_client_capabilities.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/a2ui_client_capabilities.json)
    *   `a2ui_client_data_model.json`: [`specification/v0_9/json/a2ui_client_data_model.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/a2ui_client_data_model.json)
    *   `basic_catalog.json`: [`specification/v0_9/json/basic_catalog.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/basic_catalog.json)
    *   `basic_catalog_rules.txt`: [`specification/v0_9/json/basic_catalog_rules.txt`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/basic_catalog_rules.txt)
    *   `client_to_server.json`: [`specification/v0_9/json/client_to_server.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/client_to_server.json)
    *   `client_to_server_list.json`: [`specification/v0_9/json/client_to_server_list.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/client_to_server_list.json)
    *   `common_types.json`: [`specification/v0_9/json/common_types.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/common_types.json)
    *   `server_to_client.json`: [`specification/v0_9/json/server_to_client.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/server_to_client.json)
    *   `server_to_client_list.json`: [`specification/v0_9/json/server_to_client_list.json`](https://github.com/google/A2UI/tree/main/specification/v0_9/json/server_to_client_list.json)
*   **Web Core Reference Implementation:**
    *   `renderers/web_core/src/v0_9/`
    *   [GitHub Link](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_9)
*   **Flutter Implementation:**
    *   The Flutter renderer is maintained in a separate repository.
    *   [GitHub Link](https://github.com/flutter/genui/tree/main/packages/genui)