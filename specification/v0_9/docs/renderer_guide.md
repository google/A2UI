# Unified Architecture & Implementation Guide

This document describes the architecture of an A2UI client implementation. The design separates concerns into distinct layers to maximize code reuse, ensure memory safety, and provide a streamlined developer experience when adding custom components.

Both the core data structures and the rendering components are completely agnostic to the specific UI being rendered. Instead, they interact with **Catalogs**. Within a catalog, the implementation follows a structured split: from the pure **Component Schema** down to the **Framework-Specific Adapter** that paints the pixels.

## Implementation Topologies
Because A2UI spans multiple languages and UI paradigms, the strictness and location of these architectural boundaries will vary depending on the target ecosystem.

### Dynamic Languages (e.g., TypeScript / JavaScript)
In highly dynamic ecosystems like the web, the architecture is typically split across multiple packages to maximize code reuse across diverse UI frameworks (React, Angular, Vue, Lit).
*   **Core Library (`web_core`)**: Implements the Core Data Layer, Component Schemas, and a Generic Binder Layer. Because TS/JS has powerful runtime reflection, the core library can provide a generic binder that automatically handles all data binding without framework-specific code. 
*   **Framework Library (`react_renderer`, `angular_renderer`)**: Implements the Framework-Specific Adapters and the actual view implementations (the React `Button`, `Text`, etc.).

### Static Languages (e.g., Kotlin, Swift, Dart)
In statically typed languages (and AOT-compiled languages like Dart), runtime reflection is often limited or discouraged for performance reasons.
*   **Core Library (e.g., `kotlin_core`)**: Implements the Core Data Layer and Component Schemas. The core library typically provides a manually implemented **Binder Layer** for the standard Basic Catalog components. This ensures that even in static environments, basic components have a standardized, framework-agnostic reactive state definition.
*   **Code Generation (Future/Optional)**: While the core library starts with manual binders, it may eventually offer Code Generation (e.g., KSP, Swift Macros) to automate the creation of Binders for custom components.
*   **Custom Components**: In the absence of code generation, developers implementing new, ad-hoc components typically utilize a **"Binderless" Implementation** flow, which allows for direct binding to the data model without intermediate boilerplate.
*   **Framework Library (e.g., `compose_renderer`)**: Uses the predefined Binders to connect to native UI state and implements the actual visual components.

### Combined Core + Framework Libraries (e.g., Swift + SwiftUI)
In ecosystems dominated by a single UI framework (like iOS with SwiftUI), developers often build a single, unified library rather than splitting Core and Framework into separate packages.
*   **Relaxed Boundaries**: The strict separation between Core and Framework libraries can be relaxed. The generic `ComponentContext` and the framework-specific adapter logic are often tightly integrated.
*   **Why Keep the Binder Layer?**: Even in a combined library, defining the intermediate Binder Layer remains highly recommended. It standardizes how A2UI data resolves into reactive state. This allows developers adopting the library to easily write alternative implementations of well-known components without having to rewrite the complex, boilerplate-heavy A2UI data subscription logic.

---

## 1. The Core Data Layer (Framework Agnostic)

The Data Layer is responsible for receiving the wire protocol (JSON messages), parsing them, and maintaining a long-lived, mutable state object. This layer follows the exact same design in all programming languages (with minor syntactical variations) and **does not require design work when porting to a new framework**. 

> **Note on Language & Frameworks**: While the examples in this document are provided in TypeScript for clarity, the A2UI Data Layer is intended to be implemented in any language (e.g., Java, Python, Swift, Kotlin, Rust) and remain completely independent of any specific UI framework.

It consists of three sub-components: the Processing Layer, the Models, and the Context Layer.

### Prerequisites

To implement the Data Layer effectively, your target environment needs two foundational utilities: a Schema Library and an Observable Library.

#### 1. Schema Library
To represent and validate component and function APIs, the Data Layer requires a **Schema Library**. 

*   **Ideal Choice**: A library (like **Zod** in TypeScript or **Pydantic** in Python) that allows for programmatic definition of schemas and the ability to validate raw JSON data against those definitions.
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
We strictly separate **construction** from **composition**. Parent containers do not act as factories for their children. This decoupling allows child classes to evolve their constructor signatures without breaking the parent. It also simplifies testing by allowing mock children to be injected easily.

*   **Pattern:**
    ```typescript
    // Parent knows nothing about Child's constructor options
    const child = new ChildModel(config); 
    parent.addChild(child); 
    ```

#### 2. Standard Observer Pattern (Observability)
The models must provide a mechanism for the rendering layer to observe changes. 

**Principles:**
1.  **Low Dependency**: Prefer "lowest common denominator" mechanisms over complex reactive libraries.
2.  **Multi-Cast**: The mechanism must support multiple listeners registered simultaneously.
3.  **Unsubscribe Pattern**: There MUST be a clear way to stop listening and prevent memory leaks.
4.  **Payload Support**: The mechanism must communicate specific data updates and lifecycle events.
5.  **Consistency**: This pattern is used uniformly across the whole state model.

#### 3. Granular Reactivity
The model is designed to support high-performance rendering through granular updates rather than full-surface refreshes.
*   **Structure Changes**: The `SurfaceComponentsModel` notifies when items are added/removed.
*   **Property Changes**: The `ComponentModel` notifies when its specific configuration changes.
*   **Data Changes**: The `DataModel` notifies only subscribers to the specific path that changed.

### Key Interfaces and Classes
*   **`MessageProcessor`**: The entry point that ingests raw JSON streams.
*   **`SurfaceGroupModel`**: The root container for all active surfaces.
*   **`SurfaceModel`**: Represents the state of a single UI surface.
*   **`SurfaceComponentsModel`**: A flat collection of component configurations.
*   **`ComponentModel`**: A specific component's raw configuration.
*   **`DataModel`**: A dedicated store for application data.
*   **`DataContext`**: An abstraction around the data model, available functions, and the base path of a Component, which allows Component implementations to fetch and subscribe to dynamic values via a simple API. Different Component instances instantiated from the same Component ID, but with different base paths (e.g. because they are different instances of a *template*) can have a different `DataContext` instance.
*   **`ComponentContext`**: A binding object pairing a component with its data scope.

### The Models
These classes are designed to be "simple containers" for data. They hold a snapshot of the A2UI state and contain logic to implement observability. They may validate changes to prevent the system entering inconsistent states. Logic to decode A2UI messages and update the model layer should be within MessageProcessor. Logic to unwrap data model and function references should be within the context layer.

**Key Characteristics:**
*   **Mutable**: Their properties can be updated over time.
*   **Observable**: They provide mechanisms to listen for those updates.
*   **Encapsulated Composition**: Parent models hold references to children, but do not construct them.

They are organized hierarchically based on the structure of the data and component tree in A2UI e.g. SurfaceGroup, Surface, Component. Within each SurfaceModel, ComponentModels are represented as a flat list, with view hierarchy construction handled in the Surface rendering logic for each UI framework.

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
  
  readonly onSurfaceCreated: EventSource<SurfaceModel<T>>;
  readonly onSurfaceDeleted: EventSource<string>;
  readonly onAction: EventSource<ActionEvent>;
}

interface ActionEvent {
  surfaceId: string;
  sourceComponentId: string;
  name: string;
  context: Record<string, any>;
}

type ActionListener = (action: ActionEvent) => void | Promise<void>; // Handler for user interactions

class SurfaceModel<T> {
  readonly id: string;
...
  readonly catalog: Catalog<T>; // Catalog containing component implementations
  readonly dataModel: DataModel; // Scoped application data
  readonly componentsModel: SurfaceComponentsModel; // Flat component map
  readonly theme?: any; // Theme parameters (validated against catalog.theme)

  readonly onAction: EventSource<ActionEvent>;
  dispatchAction(action: ActionEvent): Promise<void>;
}
```
#### `SurfaceComponentsModel` & `ComponentModel`
Manages the raw JSON configuration of components in a flat map which includes one entry per component ID. This represents the raw Component data *before* ChildList templates are resolved, which can instantiate multiple instances of a single Component with the same ID.

```typescript
class SurfaceComponentsModel {
  get(id: string): ComponentModel | undefined;
  addComponent(component: ComponentModel): void;
  
  readonly onCreated: EventSource<ComponentModel>;
  readonly onDeleted: EventSource<string>;
}

class ComponentModel {
  readonly id: string;
  readonly type: string; // Component name (e.g. 'Button')
  
  get properties(): Record<string, any>; // Current raw JSON configuration
  set properties(newProps: Record<string, any>);
  
  readonly onUpdated: EventSource<ComponentModel>; // Invoked when any property changes
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

| Input Type                 | Target Type | Result                                                                  |
| :------------------------- | :---------- | :---------------------------------------------------------------------- |
| `String` ("true", "false") | `Boolean`   | `true` or `false` (case-insensitive). Any other string maps to `false`. |
| `Number` (non-zero)        | `Boolean`   | `true`                                                                  |
| `Number` (0)               | `Boolean`   | `false`                                                                 |
| `Any`                      | `String`    | Locale-neutral string representation                                    |
| `null` / `undefined`       | `String`    | `""` (empty string)                                                     |
| `null` / `undefined`       | `Number`    | `0`                                                                     |
| `String` (numeric)         | `Number`    | Parsed numeric value or `0`                                             |


### The Context Layer (Transient Windows)
The **Context Layer** consists of short-lived objects created on-demand during the rendering process to solve the problem of "scope" and binding resolution. 

Because the Data Layer is a flat list of components and a raw data tree, it doesn't inherently know about the hierarchy or the current data scope (e.g., inside a list iteration). The Context Layer bridges this gap. The appropriate "window" is determined by the structural parent components (like a `List`) which generate specific `DataContext` scopes for their children.

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


### The Processing Layer (`MessageProcessor`)
The **Processing Layer** acts as the "Controller." It accepts the raw stream of A2UI messages (`createSurface`, `updateComponents`, etc.), parses them, and mutates the underlying Data Models accordingly.

It also handles generating the client capabilities payload via `getClientCapabilities()`.

```typescript
class MessageProcessor<T> {
  readonly model: SurfaceGroupModel<T>; // Root state container for all surfaces
  
  constructor(catalogs: Catalog<T>[], actionHandler: ActionListener);

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

To dynamically generate the `a2uiClientCapabilities` payload (specifically the `inlineCatalogs` array), the renderer needs to convert its internal component and theme schemas into valid JSON Schemas that adhere to the A2UI protocol.

A2UI heavily relies on shared schema definitions (like `DynamicString`, `DataBinding`, and `Action` from `common_types.json`). However, most schema validation libraries (such as Zod) do not natively support emitting external JSON Schema `$ref` pointers out-of-the-box.

To solve this, common types must be **detectable** during the JSON Schema conversion process. This is often achieved by "tagging" the schemas using their `description` property (e.g., `REF:common_types.json#/$defs/DynamicString`). 

When `getClientCapabilities()` converts the internal schemas:
1. It translates the definition into a raw JSON Schema.
2. It traverses the schema tree looking for string descriptions starting with the `REF:` tag.
3. It strips the tag and replaces the entire node with a valid JSON Schema `$ref` object.

---

## 2. Catalog API & Bindings (Framework Agnostic)

Components and functions in A2UI are organized into **Catalogs**. A catalog defines what components are available to be rendered and what client-side logic can be executed.

### The Catalog API
A catalog groups component definitions (and optionally function definitions) together so the `MessageProcessor` can validate messages and provide capabilities back to the server.

```typescript
class Catalog<T> {
  readonly id: string; // Unique catalog URI (e.g., "https://mycompany.com/catalog.json")
  readonly components: ReadonlyMap<string, T>;
  readonly functions?: ReadonlyMap<string, FunctionImplementation>;
  readonly theme?: Schema; // Schema for theme parameters (e.g. Zod object)

  constructor(id: string, components: T[], functions?: FunctionImplementation[], theme?: Schema) {
    // Initializes the properties
  }
}
```

### Creating Custom Catalogs
Extensibility is a core feature of A2UI. It should be trivial to create a new catalog by extending an existing one, combining custom components with the standard set.

*Example of composing a custom catalog:*
```python
# Pseudocode
myCustomCatalog = Catalog(
  id="https://mycompany.com/catalogs/custom_catalog.json",
  functions=basicCatalog.functions,
  components=basicCatalog.components + [MyCompanyLogoComponent()],
  theme=basicCatalog.theme # Inherit theme schema
)
```

### Layer 1: Component Schema (API Definition)
This layer defines the exact JSON footprint of a component without any rendering logic. It acts as the single source of truth for the component's contract. 

In a statically typed language without an advanced schema reflection library, this might simply be defined as basic interfaces or classes:

```kotlin
// Simple static definition (Kotlin example)
interface ComponentApi {
    val name: String
    val schema: Schema // Representing the formal property definition
}

// In the Core Library, defining the standard component API
abstract class ButtonApi : ComponentApi {
    override val name = "Button"
    override val schema = ButtonSchema // A constant representing the definition
}
```

#### Dynamic Language Optimization (e.g. Zod)
In dynamic languages like TypeScript, we can use tools like Zod to represent the schema and infer types directly from it.

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

export const ButtonDef = {
  name: "Button" as const,
  schema: ButtonSchema
} satisfies ComponentDefinition<typeof ButtonSchema>;
```

### Layer 2: The Binder Layer
A2UI components are heavily reliant on `DynamicValue` bindings, which must be resolved into reactive streams. 

The **Binder Layer** is a framework-agnostic layer that absorbs this responsibility. It takes the raw component properties and the `ComponentContext`, and transforms the reactive A2UI bindings into a single, cohesive stream of strongly-typed `ResolvedProps`.

#### Subscription Lifecycle and Cleanup
A critical responsibility of the Binding is tracking all subscriptions it creates against the underlying data model. The framework adapter (Layer 3) manages the lifecycle of the Binding. When a component is removed from the UI, the framework adapter must call the Binding's `dispose()` method. The Binding then iterates through its internally tracked subscription list and severs them, ensuring no dangling listeners remain attached to the global `DataModel`.

#### Generic Interface Concept

```typescript
// The generic Binding interface representing an active connection
export interface ComponentBinding<ResolvedProps> {
  // A stateful stream of fully resolved, ready-to-render props.
  // It must hold the current value so frameworks can read the initial state synchronously.
  readonly propsStream: StatefulStream<ResolvedProps>; // e.g. BehaviorSubject, StateFlow
  
  // Cleans up all underlying data model subscriptions
  dispose(): void;
}

// The Binder definition combining Schema + Binding Logic
export interface ComponentBinder<ResolvedProps> {
  readonly name: string;
  readonly schema: Schema; // Formal schema for validation and capabilities
  bind(context: ComponentContext): ComponentBinding<ResolvedProps>;
}
```

#### Dynamic Language Optimization: Generic Binders
For dynamic languages, you can write a generic factory that automatically inspects the schema and creates all the necessary subscriptions, avoiding the need to write manual binding logic for every single component.

```typescript
// Illustrative Generic Binder Factory
export function createGenericBinding<T>(schema: Schema, context: ComponentContext): ComponentBinding<T> {
  // 1. Walk the schema to find all DynamicValue properties.
  // 2. Map them to `context.dataContext.subscribeDynamicValue()`
  // 3. Store the returned `DataSubscription` objects.
  // 4. Combine all observables into a single stateful stream.
  // 5. Return a ComponentBinding whose `dispose()` method unsubscribes all stored subscriptions.
}
```

#### Alternative: Binderless Implementation (Direct Binding)
For frameworks that are less dynamic, lack codegen systems, or for developers who simply want to implement a single, one-off component quickly, it is perfectly valid to skip the formal binder layer and implement the component directly inside the framework adapter.

*Dart/Flutter Illustrative Example:*
```dart
// The render function handles reading from context and building the widget manually.
Widget renderButton(ComponentContext context, Widget Function(String) buildChild) {
  // Manually observe the dynamic value and manage the stream
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
```

---

## 3. Framework Binding Layer (Framework Specific)

Framework developers should not interact with raw `ComponentContext` or `ComponentBinding` directly when writing the actual UI views. Instead, the architecture provides framework-specific adapters that bridge the `Binding`'s stream to the framework's native reactivity.

### Contract of Ownership
A crucial part of A2UI's architecture is understanding who "owns" the data layers.
*   **The Data Layer (Message Processor) owns the `ComponentModel`**. It creates, updates, and destroys the component's raw data state based on the incoming JSON stream.
*   **The Framework Adapter owns the `ComponentContext` and `ComponentBinding`**. When the native framework decides to mount a component onto the screen (e.g., React runs `render`), the Framework Adapter creates the `ComponentContext` and passes it to the Binder. When the native framework unmounts the component, the Framework Adapter MUST call `binding.dispose()`.

### Data Props vs. Structural Props
It's important to distinguish between Data Props (like `label` or `value`) and Structural Props (like `child` or `children`).
*   **Data Props:** Handled entirely by the Binder. The adapter receives a stream of fully resolved values (e.g., `"Submit"` instead of a `DynamicString` path).
*   **Structural Props:** The Binder does not attempt to resolve component IDs into actual UI trees. Instead, it outputs metadata for the children that need to be rendered.
    *   For a simple `ComponentId` (e.g., `Card.child`), it emits an object like `{ id: string, basePath: string }`.
    *   For a `ChildList` (e.g., `Column.children`), it evaluates the array and emits a list of `ChildNode` streams. 
*   The framework adapter is then responsible for taking these node definitions and calling a framework-native `buildChild(id, basePath)` method recursively.

### Component Subscription Lifecycle Rules
To ensure performance and prevent memory leaks, framework adapters MUST strictly manage their subscriptions:
1.  **Lazy Subscription**: Only bind and subscribe to data paths or property updates when the component is actually mounted/attached to the UI.
2.  **Path Stability**: If a component's property changes via an `updateComponents` message, the adapter/binder MUST unsubscribe from the old path before subscribing to the new one.
3.  **Destruction / Cleanup**: When a component is removed from the UI (e.g., via a `deleteSurface` message), the framework binding MUST hook into its native lifecycle to trigger `binding.dispose()`.

### Reactive Validation (`Checkable`)
Interactive components that support the `checks` property should implement the `Checkable` trait.
*   **Aggregate Error Stream**: The component should subscribe to all `CheckRule` conditions defined in its properties.
*   **UI Feedback**: It should reactively display the `message` of the first failing check.
*   **Action Blocking**: Actions (like `Button` clicks) should be reactively disabled or blocked if any validation check fails.

### The Happy Path: Developer Experience

Once the Binder Layer and Framework Adapter are implemented, adding a new UI component becomes extremely simple and strictly type-safe. The developer does not need to worry about JSON pointers, manual subscriptions, or reactive stream lifecycles. They simply receive fully resolved, native types.

Here is an example of what the "happy path" looks like when implementing a `Button` using a generic React adapter and an existing `ButtonBinder`:

```typescript
// 1. The framework adapter infers the prop types from the Binder's Schema.
// The raw `DynamicString` label and `Action` object have been automatically 
// resolved into a static `string` and a callable `() => void` function.

// Conceptually, the inferred type looks like this:
interface ButtonResolvedProps {
  label?: string;      // Resolved from DynamicString
  action: () => void;  // Resolved from Action
  child?: string;      // Resolved structural ComponentId
}

// 2. The developer writes a simple, stateless UI component.
// The `props` argument is strictly typed to match `ButtonResolvedProps`.
const ReactButton = createReactComponent(ButtonBinder, ({ props, buildChild }) => {
  return (
    <button onClick={props.action}>
      {/* If the button has a structural child ID, we use the buildChild helper */}
      {props.child ? buildChild(props.child) : props.label}
    </button>
  );
});
```

Because of the generic types flowing through the adapter, if the developer typos `props.action` as `props.onClick`, or treats `props.label` as an object instead of a string, the compiler will immediately flag a type error.

### Example: Framework-Specific Adapters

The adapter acts as a wrapper that instantiates the binder, binds its output stream to the framework's state mechanism, injects structural rendering helpers (`buildChild`), and hooks into the native destruction lifecycle to call `dispose()`.

#### React Pseudo-Adapter
```typescript
// Pseudo-code concept for a React adapter
function createReactComponent(binder, RenderComponent) {
  return function ReactWrapper({ context, buildChild }) {
    // Hook into component mount
    const [props, setProps] = useState(binder.initialProps);
    
    useEffect(() => {
      // Create binding on mount
      const binding = binder.bind(context);
      
      // Subscribe to updates
      const sub = binding.propsStream.subscribe(newProps => setProps(newProps));
      
      // Cleanup on unmount
      return () => {
        sub.unsubscribe();
        binding.dispose(); 
      };
    }, [context]);

    return <RenderComponent props={props} buildChild={buildChild} />;
  }
}
```

#### Angular Pseudo-Adapter
```typescript
// Pseudo-code concept for an Angular adapter
@Component({
  selector: 'app-angular-wrapper',
  imports: [MatButtonModule],
  template: `
    @if (props(); as props) {
      <button mat-button>{{ props.label }}</button>
    }
  `
})
export class AngularWrapper {
  private binder = inject(BinderService);
  private context = inject(ComponentContext);

  private bindingResource = resource({
    loader: async () => {
      const binding = this.binder.bind(this.context);

      return {
        instance: binding,
        props: toSignal(binding.propsStream) // Convert Observable to Signal
      };
    },
  });

  props = computed(() => this.bindingResource.value()?.props() ?? null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.bindingResource.value()?.instance.dispose();
    });
  }
}
```

---

## 4. Basic Catalog Implementation

Once the core architecture and adapters are built, the actual catalogs can be implemented.

### Strongly-Typed Catalog Implementations
To ensure all components are properly implemented and match the exact API signature, platforms with strong type systems should utilize their advanced typing features. This ensures that a provided renderer not only exists, but its `name` and `schema` strictly match the official Catalog Definition, catching mismatches at compile time rather than runtime.

#### Statically Typed Languages (e.g. Kotlin/Swift)
In languages like Kotlin, you can define a strict interface or class that demands concrete instances of the specific component APIs defined by the Core Library.

```kotlin
// The Core Library defines the exact shape of the catalog
class BasicCatalogImplementations(
    val button: ButtonApi, // Must be an instance of the ButtonApi class
    val text: TextApi,
    val row: RowApi
    // ...
)

// The Framework Adapter implements the native views extending the base APIs
class ComposeButton : ButtonApi() {
    // Framework specific render logic
}

// The compiler forces all required components to be provided
val implementations = BasicCatalogImplementations(
    button = ComposeButton(),
    text = ComposeText(),
    row = ComposeRow()
)

val catalog = Catalog("id", listOf(implementations.button, implementations.text, implementations.row))
```

#### Dynamic Languages (e.g. TypeScript)
In TypeScript, we can use intersection types to force the framework renderer to intersect with the exact definition.

```typescript
// Concept: Forcing implementations to match the spec
type BasicCatalogImplementations = {
  Button: Renderer & { name: "Button", schema: Schema },
  Text: Renderer & { name: "Text", schema: Schema },
  Row: Renderer & { name: "Row", schema: Schema },
  // ...
};

// If a developer forgets 'Row' or spells it wrong, the compiler throws an error.
const catalog = new Catalog("id", [
  implementations.Button,
  implementations.Text,
  implementations.Row
]);
```

### Basic Catalog Core Functions
The Standard A2UI Catalog requires a shared logic layer for standard function definitions (like `length`, `formatDate`, etc.). 

#### Function Definitions
Client-side functions operate similarly to components. They require a definition (schema) and an implementation.

```typescript
interface FunctionImplementation {
  readonly name: string;
  readonly returnType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any' | 'void';
  readonly schema: Schema; // The expected arguments
  
  // Executes the function logic. Returns a value or a reactive stream.
  execute(args: Record<string, any>, context: DataContext): unknown | Observable<unknown>;
}
```

#### Expression Resolution Logic (`formatString`)
The standard `formatString` function is uniquely complex. It is responsible for interpreting the `${expression}` syntax within string properties.

**Implementation Requirements**:
1.  **Recursion**: The function implementation MUST use `DataContext.resolveDynamicValue()` or `DataContext.subscribeDynamicValue()` to recursively evaluate nested expressions or function calls (e.g., `${formatDate(value:${/date})}`).
2.  **Tokenization**: The parser must distinguish between DataPaths (e.g., `${/user/name}`) and FunctionCalls (e.g., `${now()}`).
3.  **Escaping**: Literal `${` sequences must be handled (typically by escaping as `\${`).
4.  **Reactive Coercion**: Results are transformed into strings using the Type Coercion Standards.

---

## 5. Agent Implementation Guide

If you are an AI Agent tasked with building a new renderer for A2UI, you MUST follow this strict, phased sequence of operations. Do not attempt to implement the entire architecture at once.

### 1. Context to Ingest
Before writing any code, thoroughly review:
*   `specification/v0_9/docs/a2ui_protocol.md` (for protocol rules)
*   `specification/v0_9/json/common_types.json` (for dynamic binding types)
*   `specification/v0_9/json/server_to_client.json` (for message envelopes)
*   `specification/v0_9/json/catalogs/minimal/minimal_catalog.json` (your initial target)

### 2. Key Dependency Decisions
Create a plan document explicitly stating:
*   Which **Schema Library** you will use (or if you will use raw language constructs like `structs`/`data classes`).
*   Which **Observable/Reactive Library** you will use (must support multi-cast and clear unsubscription).
*   Which native UI framework you are targeting.

### 3. Core Model Layer
Implement the framework-agnostic Data Layer (Section 1).
*   Implement standard listener patterns (`EventSource`/`EventEmitter`).
*   Implement `DataModel`, ensuring correct JSON pointer resolution and the cascade/bubble notification strategy.
*   Implement `ComponentModel`, `SurfaceComponentsModel`, `SurfaceModel`, and `SurfaceGroupModel`.
*   Implement `DataContext` and `ComponentContext`.
*   Implement `MessageProcessor`. Include logic for detecting schema references to generate `ClientCapabilities`.
*   Define the `Catalog`, `ComponentApi`, and `FunctionImplementation` interfaces.
*   Define the `ComponentBinding` interface.

### 4. Framework-Specific Layer
Implement the bridge between the agnostic models and the native UI (Section 3).
*   Define the `ComponentAdapter` API (how the core library hands off a component to the framework).
*   Implement the mechanism that binds a `ComponentBinding` stream to the native UI state (e.g., a wrapper view/widget).
*   Implement the recursive `Surface` builder that takes a `surfaceId`, finds the "root" component, and recursively calls `buildChild`.
*   **Crucial**: Ensure the unmount/dispose lifecycle hook calls `binding.dispose()`.

### 5. Minimal Catalog Support
Do not start with the full Basic Catalog. Target the `minimal_catalog.json` first.
*   **Core Library**: Create definitions/binders for `Text`, `Row`, `Column`, `Button`, and `TextField`.
*   **Core Library**: Implement the `capitalize` function.
*   **Framework Library**: Implement the actual native UI widgets for these 5 components.
*   Design a mechanism (e.g., a factory function or class) to bundle these together into a Catalog.

### 6. Demo Application (Milestone)
Build a self-contained application to prove the architecture works before scaling.
*   The app should run entirely locally (no server required).
*   It should load the JSON message arrays from `specification/v0_9/json/catalogs/minimal/examples/`.
*   It should display a list of these examples.
*   When an example is selected, it should pipe the messages into the `MessageProcessor` and render the surface.
*   **Reactivity Test**: Add a mechanism to simulate delayed `updateDataModel` messages (e.g., waiting 2 seconds before sending data) to prove that the UI progressively renders and reacts to changes.

**STOP HERE. Ask the user for approval of the architecture and demo application before proceeding to step 7.**

### 7. Basic Catalog Support
Once the minimal architecture is proven robust:
*   **Core Library**: Implement the full suite of basic functions. It is crucial to note that string interpolation and expression parsing should ONLY happen within the `formatString` function. Do not attempt to add global string interpolation to all strings.
*   **Core Library**: Create definitions/binders for the remaining Basic Catalog components.
*   **Framework Library**: Implement all remaining UI widgets.
*   **Tests**: Look at existing reference implementations (e.g., `web_core`) to formulate and run comprehensive unit and integration test cases for data coercion and function logic. 
*   Update the Demo App to load samples from `specification/v0_9/json/catalogs/basic/examples/`.
