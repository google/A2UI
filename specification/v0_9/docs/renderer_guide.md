# Unified Architecture & Implementation Guide

This document describes the architecture of an A2UI client implementation. The design separates concerns into distinct layers to maximize code reuse, ensure memory safety, and provide a streamlined developer experience when adding custom components.

Both the core data structures and the rendering components are completely agnostic to the specific UI being rendered. Instead, they interact with **Catalogs**. Within a catalog, the implementation follows a 4-layer split: from the pure **Component Schema** down to the **Framework-Specific Adapter** that paints the pixels.

## Implementation Topologies
Because A2UI spans multiple languages and UI paradigms, the strictness and location of these architectural boundaries will vary depending on the target ecosystem.

### Dynamic Languages (e.g., TypeScript / JavaScript)
In highly dynamic ecosystems like the web, the architecture is typically split across multiple packages to maximize code reuse across diverse UI frameworks (React, Angular, Vue, Lit).
*   **Core Library (`web_core`)**: Implements Layer 1 (Component Schemas) and Layer 2 (The Binder Layer). Because TS/JS has powerful runtime reflection, the core library provides a *Generic Zod Binder* that automatically handles all data binding without framework-specific code. 
*   **Framework Library (`react_renderer`, `angular_renderer`)**: Implements Layer 3 (Framework-Specific Adapters) and Layer 4 (Strongly-Typed Catalog Implementations). It provides the adapter utilities (`createReactComponent`) and the actual view implementations (the React `Button`, `Text`, etc.).

### Static Languages (e.g., Kotlin, Swift)
In statically typed languages, runtime reflection is often limited or discouraged for performance reasons.
*   **Core Library (e.g., `kotlin_core`)**: Implements Layer 1 (Component Schemas). For Layer 2, the core library typically provides a manually implemented **Binder Layer** for the standard Basic Catalog components. This ensures that even in static environments, basic components have a standardized, framework-agnostic reactive state definition.
*   **Code Generation (Future/Optional)**: While the core library starts with manual binders, it may eventually offer **Code Generation** (e.g., KSP, Swift Macros) to automate the creation of Binders for custom components.
*   **Custom Components**: In the absence of code generation, developers implementing new, ad-hoc components typically utilize the **"Binderless" Implementation** flow (see Layer 2 Alternative), which allows for direct binding to the data model without intermediate boilerplate.
*   **Framework Library (e.g., `compose_renderer`)**: Implements Layer 3 (Adapters) and Layer 4. Uses the predefined Binders to connect to native UI state.

### Combined Core + Framework Libraries (e.g., Swift + SwiftUI)
In ecosystems dominated by a single UI framework (like iOS with SwiftUI), developers often build a single, unified library rather than splitting Core and Framework into separate packages.
*   **Relaxed Boundaries**: The strict separation between Core and Framework libraries can be relaxed. The generic `ComponentContext` and the framework-specific adapter logic are often tightly integrated.
*   **Why Keep the Binder Layer?**: Even in a combined library, defining the intermediate **Binder Layer (Layer 2)** remains highly recommended. It standardizes how A2UI data resolves into reactive state (e.g., standardizing the `ComponentBinding` interface). This allows developers adopting the library to easily write alternative implementations of well-known components (e.g., swapping the default SwiftUI Button with a custom corporate-branded SwiftUI Button) without having to rewrite the complex, boilerplate-heavy A2UI data subscription logic.

---

## 1. The Data Layer

The Data Layer is responsible for receiving the wire protocol (JSON messages), parsing them, and maintaining a long-lived, mutable state object. This layer follows the exact same design in all programming languages (with minor syntactical variations) and **does not require design work when porting to a new framework**. 

> **Note on Language & Frameworks**: While the examples in this document are provided in TypeScript for clarity, the A2UI Data Layer is intended to be implemented in any language (e.g., Java, Python, Swift, Kotlin, Rust) and remain completely independent of any specific UI framework.

It consists of three sub-components: the Processing Layer, the Dumb Models, and the Context Layer.

### Prerequisites

To implement the Data Layer effectively, your target environment needs two foundational utilities: a Schema Library and an Observable Library.

#### 1. Schema Library
To represent and validate component and function APIs (Layer 1 of the Catalog), the Data Layer requires a **Schema Library**. 

*   **Ideal Choice**: A library (like **Zod** in TypeScript) that allows for programmatic definition of schemas and the ability to validate raw JSON data against those definitions.
*   **Capabilities Generation**: The library should ideally support exporting these programmatic definitions to standard JSON Schema for the `getClientCapabilities` payload.
*   **Fallback**: If no suitable programmatic library exists for the target language, raw **JSON Schema strings**, `Codable` structs, or `kotlinx.serialization` classes can be used instead.

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

### The "Dumb" Models
These classes are designed to be "dumb containers" for data. They hold the state of the UI but contain minimal logic. They are organized hierarchically.

#### SurfaceGroupModel & SurfaceModel
The root containers for active surfaces and their catalogs, data, and components.

```typescript
interface SurfaceLifecycleListener<T> {
  onSurfaceCreated?: (s: SurfaceModel<T>) => void; // Called when a new surface is registered
  onSurfaceDeleted?: (id: string) => void; // Called when a surface is removed
}

class SurfaceGroupModel<T> {
  addSurface(surface: SurfaceModel<T>): void;
  deleteSurface(id: string): void;
  getSurface(id: string): SurfaceModel<T> | undefined;
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void;
  addActionListener(l: ActionListener): () => void;
}

type ActionListener = (action: any) => void | Promise<void>; // Handler for user interactions

class SurfaceModel<T> {
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


### The Catalog API

While specific components and frameworks have their own layer definitions (detailed later), the root Data Layer relies on the concept of a **Catalog** to know which components and functions exist during processing. 

A catalog groups these definitions together so the `MessageProcessor` can validate messages and provide capabilities back to the server.

```typescript
class Catalog<T> {
  readonly id: string; // Unique catalog URI
  readonly components: ReadonlyMap<string, T>;
  readonly functions?: ReadonlyMap<string, FunctionImplementation>;

  constructor(id: string, components: T[], functions?: FunctionImplementation[]) {
    // Initializes the read-only maps
  }
}
```

### The Processing Layer (`MessageProcessor`)
The **Processing Layer** acts as the "Controller." It accepts the raw stream of A2UI messages (`createSurface`, `updateComponents`, etc.), parses them, and mutates the underlying Data Models accordingly.

It also handles generating the client capabilities payload via `getClientCapabilities()`. By passing inline catalog definitions to this method, the processor can dynamically generate JSON Schemas for the supported components, allowing the agent to understand the client's available UI components on the fly.

```typescript
class MessageProcessor<T> {
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

---

## 2. The Catalog & Component Lifecycle (4-Layer Model)

How components are rendered depends on the target framework's architecture, but all implementations of A2UI Catalogs follow a standard 4-Layer lifecycle. 

### Layer 1: Component Schema (API Definition)
This layer defines the exact JSON footprint of a component without any rendering or decoding logic. It acts as the single source of truth for the component's contract, exactly mirroring the A2UI component schema definitions. The goal is to define the properties a component accepts (like `label` or `action`) using the platform's preferred schema validation or serialization library.

#### TypeScript/Web Example
In a web environment, this is typically done using Zod to represent the JSON Schema.

```typescript
// basic_catalog_api/schemas.ts
export interface ComponentDefinition<PropsSchema extends z.ZodTypeAny> {
  name: string;
  schema: PropsSchema;
}

const ButtonSchema = z.object({
  label: DynamicStringSchema,
  action: ActionSchema,
});

// Example definition
export const ButtonDef = {
  name: "Button" as const,
  schema: ButtonSchema
} satisfies ComponentDefinition<typeof ButtonSchema>;
```

*Illustrative Examples (Swift/Kotlin):* In Swift, this might be represented by `Codable` structs mapping to the JSON structure. In Kotlin, developers might use `kotlinx.serialization` classes. The choice of serialization library is up to the platform developer, provided it can faithfully represent the A2UI component contract.

### Layer 2: The Binder Layer (Framework-Agnostic)
A2UI components are heavily reliant on `DynamicValue` bindings, which must be resolved into reactive streams. Framework renderers currently have to manually resolve these, manage context, and handle the lifecycle of data subscriptions. 

The **Binder Layer** absorbs this responsibility. It takes the raw component properties and the `ComponentContext`, and transforms the reactive A2UI bindings into a single, cohesive stream of strongly-typed `ResolvedProps`.

#### Subscription Lifecycle and Cleanup
A critical responsibility of the Binding is tracking all subscriptions it creates against the underlying data model. As outlined in the Contract of Ownership (see Layer 3), the framework adapter manages the lifecycle of the Binding. When a component is removed from the UI (because its parent was replaced, the surface was deleted, etc.), the framework adapter must call the Binding's `dispose()` method. The Binding then iterates through its internally tracked subscription list and severs them, ensuring that no dangling listeners remain attached to the global `DataModel`.

#### Generic Interface Concept
Conceptually, the binder layer looks like this in any language:

```typescript
// The generic Binding interface representing an active connection
export interface ComponentBinding<ResolvedProps> {
  // A stateful stream of fully resolved, ready-to-render props.
  // It must hold the current value so frameworks can read the initial state synchronously.
  readonly propsStream: StatefulStream<ResolvedProps>; // e.g. BehaviorSubject, StateFlow, or CurrentValueSubject
  
  // Cleans up all underlying data model subscriptions
  dispose(): void;
}

// The Binder definition combining Schema + Binding Logic
// By extending ComponentDefinition, a Binder can be used anywhere a pure schema definition is expected.
export interface ComponentBinder<RawProps, ResolvedProps> extends ComponentDefinition<RawProps> {
  bind(context: ComponentContext): ComponentBinding<ResolvedProps>;
}
```

*Note on Stateful Streams:* The `propsStream` should ideally be a stateful stream (common examples include `BehaviorSubject` in RxJS, `StateFlow` in Kotlin Coroutines, or `CurrentValueSubject` in Swift Combine). UI frameworks typically require an initial state to render the first frame synchronously. Because `DataContext.subscribeDynamicValue()` resolves its initial value synchronously, the binder can immediately seed the stream with the fully resolved initial properties.

#### Generic Binders via Zod (Web Implementation Example)
For TypeScript/Web implementations, one approach is to write a generic `ZodBinder` that automatically infers subscriptions. Instead of writing custom logic for every component, the binder recursively inspects the Zod schema. 

When the `ZodBinder` walks the schema and encounters known A2UI dynamic types (e.g., `DynamicStringSchema`), it automatically invokes `context.dataContext.subscribeDynamicValue()`. It stores the returned subscription objects in an internal array. When `dispose()` is called, it loops through this array and unsubscribes them all.

```typescript
// Illustrative Generic Zod Binding Factory
export function createZodBinding<T extends z.ZodTypeAny>(
  schema: T, 
  context: ComponentContext
): ComponentBinding<z.infer<T>> {
  // 1. Walk the schema to find all DynamicValue and Action properties.
  // 2. Map `DynamicValue` properties to `context.dataContext.subscribeDynamicValue()` 
  //    and store the returned `DataSubscription` objects.
  // 3. Map `Action` properties to `context.dispatchAction()`.
  // 4. Combine all observables (e.g., using `combineLatest` in RxJS) into a single stateful stream.
  // 5. Return an object conforming to ComponentBinding whose `dispose()` method unsubscribes all stored subscriptions.
  
  return new GenericZodBinding(schema, context);
}

// Button implementation becomes simplified by leveraging the existing ButtonDef:
export const ButtonBinder: ComponentBinder<typeof ButtonDef.schema, ButtonResolvedProps> = {
  ...ButtonDef,
  bind: (ctx) => createZodBinding(ButtonDef.schema, ctx)
};
```

*Note for Static Languages (Swift/Kotlin):* While dynamic runtime reflection is common in web environments, static languages may prefer different strategies. For example, Swift or Kotlin environments might leverage Code Generation (such as Swift Macros or KSP) to generate the boilerplate `Binding` logic based on the schema at compile-time.

#### Alternative: Binderless Implementation (Direct Binding)
For frameworks that are less dynamic, lack codegen systems, or for developers who simply want to implement a single, one-off component without the abstraction overhead of a generic binder, it is perfectly valid to skip the formal binder layer and implement the component directly.

In a "binderless" setup, the developer creates the component in one step. The system directly receives the schema, and the render function takes the raw `ComponentContext` (or a lightweight framework-specific wrapper around it), manually subscribing to dynamic properties and returning the native UI element.

**Dart/Flutter Illustrative Example:**
```dart
// direct_component.dart

// The developer defines the component in one unified step without a separate binder.
final myButtonComponent = FrameworkComponent(
  name: 'Button',
  schema: buttonSchema, // A schematic representation of the properties
  
  // The render function handles reading from context and building the widget.
  // It receives the A2UI ComponentContext and a helper to build children.
  render: (ComponentContext context, Widget Function(String) buildChild) {
    // 1. Manually resolve or subscribe to dynamic values.
    // (In Flutter, this might be wrapped in a StreamBuilder or custom hook
    //  that handles the unsubscription automatically on dispose).
    return StreamBuilder(
      stream: context.dataContext.observeDynamicValue(context.componentModel.properties['label']),
      builder: (context, snapshot) {
        return ElevatedButton(
          onPressed: () {
            context.dispatchAction(context.componentModel.properties['action']);
          },
          child: Text(snapshot.data?.toString() ?? ''),
        );
      }
    );
  }
);
```
While this approach bypasses the reusable binder layer, it offers a straightforward path for adding custom components and remains fully compliant with the architecture's boundaries.

### Layer 3: Framework-Specific Adapters
Framework developers should not interact with `ComponentContext` or `ComponentBinding` directly when writing the actual UI view. Instead, the architecture should provide framework-specific adapters that bridge the `Binding`'s stream to the framework's native reactivity and automatically handle the disposal lifecycle to guarantee memory safety.

#### Contract of Ownership
A crucial part of A2UI's architecture is understanding who "owns" the data layers.
*   **The Data Layer (Message Processor) owns the `ComponentModel`**. It creates, updates, and destroys the component's raw data state based on the incoming JSON stream.
*   **The Framework Adapter owns the `ComponentContext` and `ComponentBinding`**. When the native framework decides to mount a component onto the screen (e.g., React runs `render`, Flutter runs `build`), the Framework Adapter creates the `ComponentContext` and passes it to the Binder to create a `ComponentBinding`. When the native framework unmounts the component, the Framework Adapter MUST call `binding.dispose()`.

#### Data Props vs. Structural Props
It's important to distinguish between Data Props (like `label` or `value`) and Structural Props (like `child` or `children`).
*   **Data Props:** Handled entirely by the Binder. The adapter receives a stream of fully resolved values (e.g., `"Submit"` instead of a `DynamicString`).
*   **Structural Props:** The Binder does not attempt to resolve component IDs into actual UI trees. Instead, it outputs metadata for the children that need to be rendered.
    *   For a simple `ComponentId` (e.g., `Card.child`), it emits an object like `{ id: string, basePath: string }`.
    *   For a `ChildList` (e.g., `Column.children`), it evaluates the array and emits a `ChildNode[]` stream. If the `ChildList` is a template, the Binder subscribes to the array in the `DataModel` and maps each item to `{ id: templateId, basePath: '/path/to/array/index' }` (where `index` is the specific index of the item, effectively scoping the child to that specific element). 
*   The framework adapter is then responsible for taking these node definitions and calling a framework-native `buildChild(id, basePath)` method.

The adapter acts as a wrapper that:
1. Instantiates the binder (obtaining a `ComponentBinding`).
2. Binds the binding's output stream to the framework's state mechanism.
3. Injects structural rendering helpers (like `buildChild`) alongside the resolved data properties.
4. Passes everything into the developer's view implementation.
5. Hooks into the framework's native destruction lifecycle to call `binding.dispose()`.

#### React Adapter Illustrative Example
React supports subscribing to external stores directly. An adapter might leverage utilities like `useSyncExternalStore` or `useEffect` to hook into the binding's stream, using the native cleanup mechanisms to dispose of the binding when the component unmounts. It also provides a `buildChild` helper.

```typescript
// react_adapter.ts
export interface ChildNode { id: string; basePath?: string; }

export function createReactComponent<Raw, Resolved>(
  binder: ComponentBinder<Raw, Resolved>,
  RenderComponent: React.FC<{ props: Resolved, buildChild: (node: ChildNode) => React.ReactNode }>
): ReactComponentRenderer {
  return {
    name: binder.name,
    schema: binder.schema,
    render: (ctx: ComponentContext) => {
      // Adapter maps `propsStream` into React state.
      // One common pattern is registering `binding.dispose()` inside a `useEffect` cleanup block
      // so when React unmounts this component, the DataModel subscriptions are severed.
      // The wrapper also provides the `buildChild` implementation.
      return <ReactAdapterWrapper context={ctx} binder={binder} RenderComponent={RenderComponent} />;
    }
  };
}

// Usage (Button - Data Props only):
const ReactButton = createReactComponent(ButtonBinder, ({ props }) => (
  <button onClick={props.action}>{props.label}</button>
));

// Usage (Card - Structural Props):
const ReactCard = createReactComponent(CardBinder, ({ props, buildChild }) => (
  <div className="card">
    {buildChild(props.child)} 
  </div>
));

// Usage (Column - ChildList Props):
const ReactColumn = createReactComponent(ColumnBinder, ({ props, buildChild }) => (
  <div className="column">
    {props.children.map((childNode, index) => (
      <React.Fragment key={index}>
        {buildChild(childNode)}
      </React.Fragment>
    ))}
  </div>
));
```

#### Angular Adapter Illustrative Example
Angular often utilizes explicit Input bindings and lifecycle hooks. An Angular adapter might take the binding stream and manage updates via `ChangeDetectorRef` or the `AsyncPipe`.

```typescript
// angular_adapter.ts
export function createAngularComponent<Raw, Resolved>(
  binder: ComponentBinder<Raw, Resolved>,
  ComponentClass: Type<any> // The Angular Component Class
): AngularComponentRenderer {
  return {
    name: binder.name,
    schema: binder.schema,
    render: (ctx: ComponentContext, viewContainerRef: ViewContainerRef) => {
      // 1. Instantiates the Angular Component.
      // 2. Creates the binding via binder.bind(ctx).
      // 3. Subscribes to `binding.propsStream` and updates component instance inputs.
      // 4. Manages change detection.
      // 5. Hooks into native destruction (e.g. ngOnDestroy) to call `binding.dispose()`.
      return new AngularAdapterWrapper(ctx, binder, ComponentClass, viewContainerRef);
    }
  };
}

// Usage in an app:
@Component({
  selector: 'app-button',
  template: `<button (click)="action()">{{ label }}</button>`
})
export class AngularButtonComponent {
  @Input() label: string = '';
  @Input() action: () => void = () => {};
}

const NgButton = createAngularComponent(ButtonBinder, AngularButtonComponent);
```

#### SwiftUI / Compose Illustrative Concepts
*   **SwiftUI:** An adapter might wrap the binding's publisher into an `@ObservedObject` or `@StateObject`. The `dispose()` call could be placed in the `.onDisappear` modifier or within the `deinit` block of the observable object.
*   **Jetpack Compose:** An adapter might convert a `StateFlow` to Compose state using utilities like `collectAsState()`. The `dispose()` call could be managed using a `DisposableEffect` keyed on the component instance.

#### Framework Component Traits

**Reactive Validation (`Checkable`)**
Interactive components that support the `checks` property should implement the `Checkable` trait.
*   **Aggregate Error Stream**: The component should subscribe to all `CheckRule` conditions defined in its properties.
*   **UI Feedback**: It should reactively display the `message` of the first failing check as a validation error hint.
*   **Action Blocking**: Actions (like `Button` clicks) should be reactively disabled or blocked if any validation check in the surface or component fails.

**Component Subscription Lifecycle Rules**
To ensure performance and prevent memory leaks, framework adapters MUST strictly manage their subscriptions. Follow these rules:
1.  **Lazy Subscription**: Only bind and subscribe to data paths or property updates when the component is actually mounted/attached to the UI.
2.  **Path Stability**: If a component's property (e.g., a `value` data path) changes via an `updateComponents` message, the adapter/binder MUST unsubscribe from the old path before subscribing to the new one.
3.  **Destruction / Cleanup**: As outlined above, when a component is removed from the UI (e.g., via a `deleteSurface` message, a conditional render, or when its parent is replaced), the framework binding MUST hook into its native lifecycle to trigger `binding.dispose()`. This ensures listeners are cleared from the `DataModel`.

### Layer 4: Strongly-Typed Catalog Implementations
To solve the problem of ensuring all components are properly implemented *and* match the exact API signature, platforms with strong type systems should utilize their advanced typing features (like intersection types in TypeScript or protocols/interfaces in Swift/Kotlin).

This ensures that a provided renderer not only exists, but its `name` and `schema` strictly match the official Catalog Definition, catching mismatches at compile time rather than runtime.

#### TypeScript Implementation Example
We use TypeScript intersection types to force the framework renderer to intersect with the exact definition.

```typescript
// basic_catalog_api/implementation.ts

// The implementation map forces the framework renderer to intersect with the exact definition
export type BasicCatalogImplementation<TRenderer extends ComponentDefinition<string, any>> = {
  Button: TRenderer & { name: "Button", schema: typeof ButtonDef.schema };
  Text: TRenderer & { name: "Text", schema: typeof TextDef.schema };
  Row: TRenderer & { name: "Row", schema: typeof RowDef.schema };
  Column: TRenderer & { name: "Column", schema: typeof ColumnDef.schema };
  // ... all basic components
};

// Angular implementation Example
// By extending ComponentDefinition, we ensure the renderer carries the required API metadata
interface AngularComponentRenderer extends ComponentDefinition<string, any> {
  // Angular-specific render method
  render: (ctx: ComponentContext, vcr: ViewContainerRef) => any; 
}

export function createAngularBasicCatalog(
  implementations: BasicCatalogImplementation<AngularComponentRenderer>
): Catalog<AngularComponentRenderer> {
  return new Catalog(
    "https://a2ui.org/basic_catalog.json", 
    Object.values(implementations)
  );
}

// Usage
const basicCatalog = createAngularBasicCatalog({
  // If NgButton's `name` is not exactly "Button", or if its 
  // `schema` doesn't match ButtonDef.schema exactly, TypeScript throws an error!
  Button: NgButton, 
  Text: NgText,
  Row: NgRow,
  Column: NgColumn,
  // ...
});
```

---

## 3. Basic Catalog Core Functions

The Standard A2UI Catalog (v0.9) requires a shared logic layer for expression resolution and standard function definitions. 

### Function Definitions
Client-side functions operate similarly to components. They require a definition and an implementation.

```typescript
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
   */
  execute(args: Record<string, any>, context: DataContext): unknown | Observable<unknown>;
}
```

A2UI categorizes client-side functions to balance performance and reactivity. 

**Observability Consistency**: Functions can return either a synchronous literal value (for static results) or a reactive stream (for values that change over time). The execution engine (`DataContext`) is responsible for treating these consistently by wrapping synchronous returns in static observables when evaluating reactively. 

**Function Categories**:
1.  **Pure Logic (Synchronous)**: Functions like `add` or `concat`. Their logic is immediate and depends only on their inputs. They typically return a static primitive value.
2.  **External State (Reactive)**: Functions like `clock()` or `networkStatus()`. These return long-lived streams that push updates to the UI independently of data model changes.
3.  **Effect Functions**: Side-effect handlers (e.g., `openUrl`, `closeModal`) that return `void`. These are typically triggered by user actions rather than interpolation.

### Expression Resolution Logic (`formatString`)
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