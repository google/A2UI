# Unified Architecture & Implementation Guide

This document describes the architecture of an A2UI client implementation. The design separates concerns into distinct layers to maximize code reuse, ensure memory safety, and provide a streamlined developer experience when adding custom components.

Both the core data structures and the rendering components interact with **Catalogs**. Within a catalog, the implementation follows a structured split: from the pure **Component Schema** down to the **Framework-Specific Adapter** that paints the pixels.

## 1. Unified Architecture Overview

The A2UI client architecture follows a strict, unidirectional data flow that bridges language-agnostic data structures with native UI frameworks. 

1. **A2UI Messages** arrive from the server (JSON).
2. The **`MessageProcessor`** parses these and updates the **`SurfaceModel`** (Agnostic State).
3. The **`Surface`** (Framework Entry View) listens to the `SurfaceModel` and begins rendering.
4. The `Surface` instantiates and renders individual **`ComponentImplementation`** nodes to build the UI tree.

This establishes a fundamental split:
*   **The Framework-Agnostic Layer (Data Layer)**: Handles JSON parsing, state management, JSON pointers, and schemas. This logic is identical across all UI frameworks within a given language.
*   **The Framework-Specific Layer (View Layer)**: Handles turning the structured state into actual pixels (React Nodes, Flutter Widgets, iOS Views).

## 2. The Core Interfaces

At the heart of the A2UI architecture are five key interfaces that connect the data to the screen.

### `ComponentApi`
The framework-agnostic definition of a component. It defines the name and the exact JSON schema footprint of the component, without any rendering logic. It acts as the single source of truth for the component's contract.

```typescript
interface ComponentApi {
  /** The name of the component as it appears in the A2UI JSON (e.g., 'Button'). */
  readonly name: string;
  /** The technical definition used for validation and generating client capabilities. */
  readonly schema: Schema; 
}
```

### `ComponentImplementation`
The framework-specific logic for rendering a component. It extends `ComponentApi` to include a `build` or `render` method.

How this looks depends on the target framework's paradigm:

**Functional / Reactive Frameworks (e.g., Flutter, SwiftUI, React)**
```typescript
interface ComponentImplementation extends ComponentApi {
  /**
   * @param ctx The component's context containing its data and state.
   * @param buildChild A closure provided by the surface to recursively build children.
   */
  build(ctx: ComponentContext<ComponentImplementation>, buildChild: (id: string) => NativeWidget): NativeWidget;
}
```

**Stateful / Imperative Frameworks (e.g., Vanilla DOM, Android Views)**
Because the catalog only holds a single "blueprint" of each `ComponentImplementation`, stateful frameworks need a way to instantiate individual objects for each component rendered on screen.
```typescript
interface ComponentInstance {
  mount(container: NativeElement): void;
  update(ctx: ComponentContext<ComponentImplementation>): void;
  unmount(): void;
}

interface ComponentImplementation extends ComponentApi {
  /** Creates a new stateful instance of this component type. */
  createInstance(ctx: ComponentContext<ComponentImplementation>): ComponentInstance;
}
```

### `Surface`
The entrypoint widget/view for a specific framework. It is instantiated with a `SurfaceModel`. It listens to the model for lifecycle events and dynamically builds the UI tree, initiating the recursive rendering loop at the component with ID `root`.

### `SurfaceModel` & `ComponentContext`
The state containers.
*   **`SurfaceModel`**: Represents the entire state of a single UI surface, holding the `DataModel` and a flat list of component configurations.
*   **`ComponentContext`**: A transient object created by the `Surface` and passed into a `ComponentImplementation` during rendering. It pairs the component's specific configuration with a scoped window into the data model (`DataContext`).

---

## THE FRAMEWORK-AGNOSTIC LAYER

## 3. The Core Data Layer (Detailed Specifications)

The Data Layer maintains a long-lived, mutable state object. This layer follows the exact same design in all programming languages and **does not require design work when porting to a new framework**. 

### Prerequisites

To implement the Data Layer effectively, your target environment needs two foundational utilities:

#### 1. Schema Library
To represent and validate component and function APIs, the Data Layer requires a **Schema Library** (like **Zod** in TypeScript or **Pydantic** in Python) that allows for programmatic definition of schemas and the ability to export them to standard JSON Schema. If no suitable library exists, raw JSON Schema strings or `Codable` structs can be used.

#### 2. Observable Library
A2UI relies on standard observer patterns. The Data Layer needs two types of reactivity:
*   **Event Streams**: Simple publish/subscribe mechanisms for discrete events (e.g., `onSurfaceCreated`, `onAction`).
*   **Stateful Streams (Signals)**: Reactive variables that hold an initial value synchronously upon subscription, and notify listeners of future changes (e.g., DataModel paths, function results). Crucially, the subscription must provide a clear mechanism to **unsubscribe** (e.g., a `dispose()` method) to prevent memory leaks.

### Design Principles

#### 1. The "Add" Pattern for Composition
We strictly separate **construction** from **composition**. Parent containers do not act as factories for their children.
```typescript
const child = new ChildModel(config); 
parent.addChild(child); 
```

#### 2. Standard Observer Pattern
Models must provide a mechanism for the rendering layer to observe changes. 
1.  **Low Dependency**: Prefer "lowest common denominator" mechanisms.
2.  **Multi-Cast**: Support multiple listeners registered simultaneously.
3.  **Unsubscribe Pattern**: There MUST be a clear way to stop listening.
4.  **Payload Support**: Communicate specific data updates and lifecycle events.
5.  **Consistency**: Used uniformly across `SurfaceGroupModel` (lifecycle), `SurfaceModel` (actions), `SurfaceComponentsModel` (lifecycle), `ComponentModel` (updates), and `DataModel` (data changes).

#### 3. Granular Reactivity
The model is designed to support high-performance rendering through granular updates.
*   **Structure Changes**: The `SurfaceComponentsModel` notifies when items are added/removed.
*   **Property Changes**: The `ComponentModel` notifies when its specific configuration changes.
*   **Data Changes**: The `DataModel` notifies only subscribers to the specific path that changed.

### The Models

#### SurfaceGroupModel & SurfaceModel
The root containers for active surfaces and their catalogs, data, and components.

```typescript
interface SurfaceLifecycleListener<T extends ComponentApi> {
  onSurfaceCreated?: (s: SurfaceModel<T>) => void;
  onSurfaceDeleted?: (id: string) => void;
}

class SurfaceGroupModel<T extends ComponentApi> {
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

type ActionListener = (action: ActionEvent) => void | Promise<void>;

class SurfaceModel<T extends ComponentApi> {
  readonly id: string;
...
  readonly catalog: Catalog<T>;
  readonly dataModel: DataModel;
  readonly componentsModel: SurfaceComponentsModel;
  readonly theme?: any;

  readonly onAction: EventSource<ActionEvent>;
  dispatchAction(action: ActionEvent): Promise<void>;
}
```

#### `SurfaceComponentsModel` & `ComponentModel`
Manages the raw JSON configuration of components in a flat map.

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
  
  get properties(): Record<string, any>;
  set properties(newProps: Record<string, any>);
  
  readonly onUpdated: EventSource<ComponentModel>;
}
```

#### `DataModel`
A dedicated store for application data.

```typescript
interface Subscription<T> {
  readonly value: T | undefined; // Latest evaluated value
  unsubscribe(): void;
}

class DataModel {
  get(path: string): any; // Resolve JSON Pointer to value
  set(path: string, value: any): void; // Atomic update at path
  subscribe<T>(path: string, onChange: (v: T | undefined) => void): Subscription<T>; // Reactive path monitoring
  dispose(): void;
}
```

**JSON Pointer Implementation Rules**:
1.  **Auto-typing (Auto-vivification)**: When setting a value at a nested path (e.g., `/a/b/0/c`), create intermediate segments. If the next segment is numeric (`0`), initialize as an Array `[]`, otherwise an Object `{}`.
2.  **Notification Strategy (Bubble & Cascade)**: Notify exact matches, bubble up to all parent paths, and cascade down to all nested descendant paths.
3.  **Undefined Handling**: Setting an object key to `undefined` removes the key. Setting an array index to `undefined` preserves length but empties the index (sparse array).

**Type Coercion Standards**:
| Input Type                 | Target Type | Result                                                                  |
| :------------------------- | :---------- | :---------------------------------------------------------------------- |
| `String` ("true", "false") | `Boolean`   | `true` or `false` (case-insensitive). Any other string maps to `false`. |
| `Number` (non-zero)        | `Boolean`   | `true`                                                                  |
| `Number` (0)               | `Boolean`   | `false`                                                                 |
| `Any`                      | `String`    | Locale-neutral string representation                                    |
| `null` / `undefined`       | `String`    | `""` (empty string)                                                     |
| `null` / `undefined`       | `Number`    | `0`                                                                     |
| `String` (numeric)         | `Number`    | Parsed numeric value or `0`                                             |

#### The Context Layer
Transient objects created on-demand during rendering to solve "scope" and binding resolution.

```typescript
class DataContext {
  constructor(dataModel: DataModel, path: string);
  readonly path: string;
  set(path: string, value: any): void;
  resolveDynamicValue<V>(v: any): V;
  subscribeDynamicValue<V>(v: any, onChange: (v: V | undefined) => void): Subscription<V>;
  nested(relativePath: string): DataContext;
}

class ComponentContext<T extends ComponentApi> {
  constructor(surface: SurfaceModel<T>, componentId: string, basePath?: string);
  readonly componentModel: ComponentModel;
  readonly dataContext: DataContext;
  readonly surfaceComponents: SurfaceComponentsModel; // The escape hatch
  dispatchAction(action: any): Promise<void>;
}
```

*Escape Hatch*: Component implementations can use `ctx.surfaceComponents` to inspect the metadata of other components in the same surface (e.g. a `Row` checking if children have a `weight` property). This is discouraged but necessary for some layout engines.

### The Processing Layer (`MessageProcessor`)
The "Controller" that accepts the raw stream of A2UI messages, parses them, and mutates the Models.

```typescript
class MessageProcessor<T extends ComponentApi> {
  readonly model: SurfaceGroupModel<T>;
  
  constructor(catalogs: Catalog<T>[], actionHandler: ActionListener);

  processMessages(messages: any[]): void;
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void;
  getClientCapabilities(options?: CapabilitiesOptions): any;
}
```

*   **Component Lifecycle**: If an `updateComponents` message provides an existing `id` but a *different* `type`, the processor MUST remove the old component and create a fresh one to ensure framework renderers correctly reset their internal state.

#### Generating Client Capabilities and Schema Types
To dynamically generate the `a2uiClientCapabilities` payload (specifically `inlineCatalogs`), the processor must convert internal component schemas into valid JSON Schemas.

**Schema Types Location**: Foundational schema types *should* be defined in a dedicated directory like `schema`. You can see the `renderers/web_core/src/v0_9/schema/common-types.ts` file in the reference web implementation as an example.

**Detectable Common Types**: Shared definitions (like `DynamicString`) must emit external JSON Schema `$ref` pointers. This is achieved by "tagging" the schemas using their `description` property (e.g., `REF:common_types.json#/$defs/DynamicString`). 

When `getClientCapabilities()` converts internal schemas:
1. Translate the definition into a raw JSON Schema.
2. Traverse the tree looking for descriptions starting with `REF:`.
3. Strip the tag and replace the node with a valid JSON Schema `$ref` object.
4. Wrap property schemas in the standard A2UI component envelope (`allOf` containing `ComponentCommon`).

## 4. The Catalog API & Functions

A catalog groups component definitions and function definitions together.

```typescript
interface FunctionApi {
  readonly name: string;
  readonly returnType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any' | 'void';
  readonly schema: Schema; // The expected arguments
}

/**
 * A function implementation. Splitting API from Implementation is less critical than 
 * for components because functions are framework-agnostic, but it allows for 
 * re-using API definitions across different implementation providers.
 */
interface FunctionImplementation extends FunctionApi {
  // Executes the function logic. Accepts static inputs, returns a value or a reactive stream.
  execute(args: Record<string, any>, context: DataContext): unknown | Observable<unknown>;
}

class Catalog<T extends ComponentApi> {
  readonly id: string; // Unique catalog URI
  readonly components: ReadonlyMap<string, T>;
  readonly functions?: ReadonlyMap<string, FunctionImplementation>;
  readonly theme?: Schema;

  constructor(id: string, components: T[], functions?: FunctionImplementation[], theme?: Schema) {
    // Initializes the properties
  }
}
```

**Function Implementation Details**:
Functions in A2UI accept statically resolved values as input arguments (not observable streams). However, they can return an observable stream (or Signal) to provide reactive updates to the UI, or they can simply return a static value synchronously.

Functions generally fall into a few common patterns:
1.  **Pure Logic (Synchronous)**: Functions like `add` or `concat`. Their logic is immediate and depends only on their inputs. They typically return a static value.
2.  **External State (Reactive)**: Functions like `clock()` or `networkStatus()`. These return long-lived streams that push updates to the UI independently of data model changes.
3.  **Effect Functions**: Side-effect handlers (e.g., `openUrl`, `closeModal`) that return `void`. These are triggered by user actions rather than interpolation.

If a function returns a reactive stream, it MUST use an idiomatic listening mechanism that supports standard unsubscription. To properly support an AI agent, functions SHOULD include a schema to generate accurate client capabilities.

---

## THE FRAMEWORK-SPECIFIC LAYER

## 5. Component Implementation Strategies

While the `ComponentImplementation` API dictates that a component must be able to `build()` or `mount()`, *how* a developer connects that view to the reactive data model inside `ComponentContext` varies by language capabilities.

### Strategy 1: Direct / Binderless Implementation
The most straightforward approach. The developer implements the `ComponentImplementation` and manually manages A2UI reactivity directly within the `build` method using the framework's native reactive tools (e.g., `StreamBuilder` in Flutter, or manual `useEffect` in React).

*Example: Flutter Direct Implementation*
```dart
Widget build(ComponentContext context, ChildBuilderCallback buildChild) {
  return StreamBuilder(
    // Manually observe the dynamic value stream
    stream: context.dataContext.observeDynamicValue(context.componentModel.properties['label']),
    builder: (context, snapshot) {
      return ElevatedButton(
        onPressed: () => context.dispatchAction(context.componentModel.properties['action']),
        child: Text(snapshot.data?.toString() ?? ''),
      );
    }
  );
}
```

### Strategy 2: The Binder Layer Pattern
For complex applications, scattering manual A2UI subscription logic across all view components becomes repetitive and error-prone. 

The **Binder Layer** is an intermediate abstraction. It takes raw component properties and transforms the reactive A2UI bindings into a single, cohesive stream of strongly-typed `ResolvedProps`. The view component simply listens to this generic stream.

```typescript
export interface ComponentBinding<ResolvedProps> {
  readonly propsStream: StatefulStream<ResolvedProps>; // e.g. BehaviorSubject
  dispose(): void; // Cleans up all underlying data model subscriptions
}

export interface ComponentBinder<ResolvedProps> {
  readonly schema: Schema;
  bind(context: ComponentContext<any>): ComponentBinding<ResolvedProps>;
}
```

### Strategy 3: Generic Binders for Dynamic Languages
In languages with powerful runtime reflection (like TypeScript/Zod), the Binder Layer can be entirely automated. You can write a generic factory that inspects a component's schema and automatically creates all necessary data model subscriptions, inferring strict types.

This provides the ultimate "happy path" developer experience. The developer writes a simple, stateless UI component that receives native types, completely abstracted from A2UI's internals.

```typescript
// The developer writes a simple, stateless UI component.
// The `props` argument is strictly inferred from the ButtonSchema.
const ReactButton = createReactComponent(ButtonBinder, ({ props, buildChild }) => {
  return (
    <button onClick={props.action}>
      {props.child ? buildChild(props.child) : props.label}
    </button>
  );
});
```

## 6. Framework Binding Lifecycles & Traits

Regardless of the implementation strategy chosen, the framework adapter or `ComponentImplementation` MUST strictly manage subscriptions to ensure performance and prevent memory leaks.

### Component Subscription Lifecycle Rules
1.  **Lazy Subscription**: Only bind and subscribe to data paths or property updates when the component is actually mounted/attached to the UI.
2.  **Path Stability**: If a component's property changes via an `updateComponents` message, you MUST unsubscribe from the old path before subscribing to the new one.
3.  **Destruction / Cleanup**: When a component is removed from the UI (e.g., via a `deleteSurface` message), the implementation MUST hook into its native lifecycle to dispose of all data model subscriptions.

### Reactive Validation (`Checkable`)
Interactive components that support the `checks` property should implement the `Checkable` trait.
*   **Aggregate Error Stream**: The component should subscribe to all `CheckRule` conditions defined in its properties.
*   **UI Feedback**: It should reactively display the `message` of the first failing check as a validation error hint.
*   **Action Blocking**: Actions (like `Button` clicks) should be reactively disabled or blocked if any validation check fails.

---

## STANDARDS & TOOLING

## 7. The Basic Catalog Standard

The standard A2UI Basic Catalog specifies a set of core components (Button, Text, Row, Column) and functions.

### Strict API / Implementation Separation
When building libraries that provide the Basic Catalog, it is **crucial** to separate the pure API (the Schemas and `ComponentApi`/`FunctionApi` definitions) from the actual UI implementations.

*   **Multi-Framework Code Reuse**: In ecosystems like the Web, this allows a shared `web_core` library to define the Basic Catalog API and Binders once, while separate packages (`react_renderer`, `angular_renderer`) provide the native view implementations.
*   **Developer Overrides**: By exposing the standard API definitions, developers adopting A2UI can easily swap in custom UI implementations (e.g., replacing the default `Button` with their company's internal Design System `Button`) without having to rewrite the complex A2UI validation, data binding, and capability generation logic. 

### Expression Resolution Logic (`formatString`)
The Basic Catalog requires a `formatString` function capable of interpreting `${expression}` syntax within string properties.

**Implementation Requirements**:
1.  **Recursion**: The implementation MUST use `DataContext.resolveDynamicValue()` or `DataContext.subscribeDynamicValue()` to recursively evaluate nested expressions or function calls (e.g., `${formatDate(value:${/date})}`).
2.  **Tokenization**: Distinguish between DataPaths (e.g., `${/user/name}`) and FunctionCalls (e.g., `${now()}`).
3.  **Escaping**: Literal `${` sequences must be handled (typically escaping as `\${`).
4.  **Reactive Coercion**: Results are transformed into strings using the standard Type Coercion rules.

## 8. The Gallery App

The Gallery App is a comprehensive development and debugging tool that serves as the reference environment for an A2UI renderer. It allows developers to visualize components, inspect the live data model, step through progressive rendering, and verify interaction logic.

### UX Architecture
The Gallery App must implement a three-column layout:
1.  **Left Column (Sample Navigation)**: A list of available A2UI samples.
2.  **Center Column (Rendering & Messages)**:
    *   **Surface Preview**: Renders the active A2UI `Surface`.
    *   **JSON Message Stream**: Displays the list of A2UI JSON messages.
    *   **Interactive Stepper**: An "Advance" button allows processing messages one by one to verify progressive rendering.
3.  **Right Column (Live Inspection)**:
    *   **Data Model Pane**: A live-updating view of the full Data Model.
    *   **Action Logs Pane**: A log of triggered actions and their context.

### Integration Testing Requirements
Every renderer implementation must include a suite of automated integration tests that utilize the Gallery App's logic to verify:
*   **Static Rendering**: Opening "Simple Text" renders correctly.
*   **Layout Integrity**: "Row Layout" places elements correctly.
*   **Two-Way Binding**: Typing in a TextField updates both the UI and the Data Model viewer simultaneously.
*   **Reactive Logic**: Changes in one component dynamically update dependent components.
*   **Action Context Scoping**: Actions emitted from nested templates (like Lists) contain correctly resolved data scopes.

## 9. Agent Implementation Guide

If you are an AI Agent tasked with building a new renderer for A2UI, you MUST follow this strict, phased sequence of operations. 

### 1. Context to Ingest
Thoroughly review:
*   `specification/v0_9/docs/a2ui_protocol.md` (protocol rules)
*   `specification/v0_9/json/common_types.json` (dynamic binding types)
*   `specification/v0_9/json/server_to_client.json` (message envelopes)
*   `specification/v0_9/json/catalogs/minimal/minimal_catalog.json` (your initial target)

### 2. Key Architecture Decisions (Write a Plan Document)
Create a comprehensive design document detailing:
*   **Dependencies**: Which Schema Library and Observable/Reactive Library will you use? *Note: Ensure your reactive library supports both discrete event subscription (EventEmitter style) and stateful, signal-like data streams (BehaviorSubject/Signal style).*
*   **Component Architecture**: How will you define the `ComponentImplementation` API for this language and framework?
*   **Surface Architecture**: How will the `Surface` framework entry point function to recursively build children?
*   **Binding Strategy**: Will you use an intermediate Generic Binder Layer, or a direct binderless implementation?
*   **STOP HERE. Ask the user for approval on this design document before proceeding.**

### 3. Core Model Layer
Implement the framework-agnostic Data Layer (Section 3).
*   Implement event streams and stateful signals.
*   Implement `DataModel`, ensuring correct JSON pointer resolution and the cascade/bubble notification strategy.
*   Implement `ComponentModel`, `SurfaceComponentsModel`, `SurfaceModel`, and `SurfaceGroupModel`.
*   Implement `DataContext` and `ComponentContext`.
*   Implement `MessageProcessor` and ClientCapabilities generation.
*   **Action**: Write unit tests for the `DataModel` (especially pointer resolution/cascade logic) and `MessageProcessor`. Ensure they pass before continuing.

### 4. Framework-Specific Layer
Implement the bridge between models and native UI (Section 5 & 6).
*   Define the concrete `ComponentImplementation` base class/interface.
*   Implement the `Surface` view/widget that recurses through components.
*   Implement subscription lifecycle management (lazy mounting, unmounting disposal).

### 5. Minimal Catalog Support
Target the `minimal_catalog.json` first.
*   Implement the pure API schemas for `Text`, `Row`, `Column`, `Button`, `TextField`.
*   Implement the specific native UI rendering components for these.
*   Implement the `capitalize` function.
*   Bundle these into a `Catalog`.
*   **Action**: Write unit tests verifying that properties update reactively when data changes.

### 6. Gallery Application (Milestone)
Build the Gallery App following the requirements in **Section 8**.
*   Load JSON samples from `specification/v0_9/json/catalogs/minimal/examples/`.
*   Verify progressive rendering and reactivity.
*   **STOP HERE. Ask the user for approval of the architecture and gallery application before proceeding to step 7.**

### 7. Basic Catalog Support
*   Implement the full suite of Basic Catalog core functions (including `formatString`).
*   Implement the remaining Basic Catalog schemas and UI components.
*   Write comprehensive unit tests for data coercion and function logic.
*   Update the Gallery App to load samples from `specification/v0_9/json/catalogs/basic/examples/`.