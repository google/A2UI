# A2UI Core SDK Implementation Guide

This document describes the architecture and implementation requirements for an A2UI Core SDK. The Core SDK is a framework-agnostic library responsible for state management, protocol parsing, and logic evaluation. It is designed to be implemented in any programming language (client or server) to provide a consistent foundation for A2UI-powered applications.

## 1. Unified Architecture Overview

The A2UI client architecture has a well-defined data flow that bridges language-agnostic data structures with native UI frameworks.

1. **A2UI Messages** arrive from the server (JSON).
2. The **`MessageProcessor`** parses these and updates the **`SurfaceModel`** (Agnostic State).
3. The **`Surface`** (Framework Entry View) listens to the `SurfaceModel` and begins rendering.
4. The `Surface` instantiates and renders individual **`ComponentImplementation`** nodes to build the UI tree.

This establishes a fundamental split:
*   **The Framework-Agnostic Layer (Data Layer)**: Handles JSON parsing, state management, JSON pointers, and schemas. This logic is identical across all UI frameworks within a given language.
*   **The Framework-Specific Layer (View Layer)**: Handles turning the structured state into actual pixels (React Nodes, Flutter Widgets, iOS Views).

## 2. Role of the Core SDK

The Core SDK handles the "brain" of the A2UI system. It manages language-agnostic data structures and bridges the raw JSON protocol with reactive state models.

Its primary responsibilities include:
*   **Message Processing**: Parsing and validating incoming A2UI JSON messages.
*   **State Accumulation**: Maintaining the "Single Source of Truth" for UI surfaces, components, and data.
*   **Data Binding**: Resolving JSON Pointer paths and managing reactive subscriptions to the Data Model.
*   **Expression Evaluation**: Parsing and executing A2UI expressions (like `formatString`).
*   **Logic Execution**: Providing a standard execution environment for catalog functions.
*   **Capability Generation**: Translating internal schemas into standard JSON Schemas for AI agents.

## 2. Framework-Agnostic Architecture

The architecture emphasizes a clean separation between construct (the model) and visualization (the renderer). This layer follows the exact same design in all programming languages and does not require design work when porting to a new ecosystem.

### Foundational Prerequisites

The very first step in implementing a Core SDK is choosing two critical libraries that will dictate the ergonomics and performance of your implementation.

#### 1. Choice of Schema Library
To represent and validate component and function APIs, the SDK requires a **Schema Library** (like **Zod** in TypeScript, **Pydantic** in Python, or **kotlinx.serialization** in Kotlin).
*   **Requirement**: It MUST allow for programmatic definition of schemas.
*   **Requirement**: It SHOULD support exporting these definitions to standard JSON Schema (required for generating client capabilities).
*   **Fallback**: If no suitable library exists, you may use raw JSON Schema strings or native language structs with a manual validation layer.

#### 2. Choice of Observable Library
A2UI is inherently reactive. The SDK needs an **Observable or Reactive Library** (like **Rx** variants, **Preact Signals**, or **Combine**) to handle state propagation.
*   **Event Streams**: Needed for discrete, one-off events (e.g., `onSurfaceCreated`, `onAction`). These typically follow a standard `EventEmitter` pattern.
*   **Stateful Streams (Signals)**: Needed for data paths and function results. These MUST hold a "current value" that can be read synchronously upon subscription and notify listeners of future changes.
*   **Memory Management**: The chosen library MUST provide a clear mechanism to **unsubscribe** or dispose of listeners to prevent memory leaks in long-running sessions.


## 3. Protocol Models & Serialization

The Core SDK defines strict, native type representations of the A2UI JSON schemas. It acts as a safe boundary between the raw network stream and internal state.

### Required Data Structures
*   **Server-to-Client Messages:** `A2uiMessage` (a union/protocol type), `CreateSurfaceMessage`, `UpdateComponentsMessage`, `UpdateDataModelMessage`, `DeleteSurfaceMessage`.
*   **Client-to-Server Events:** `ActionMessage`, `ErrorMessage`.
*   **Client Metadata:** `A2uiClientCapabilities`, `InlineCatalog`, `FunctionDefinition`, `ClientDataModel`.

### JSON Serialization & Validation
*   **Inbound (Parsing)**: The SDK must deserialize raw JSON into strongly-typed messages. If a payload violates the schema, it MUST throw an `A2uiValidationError` before reaching the state models.
*   **Outbound (Stringifying)**: The SDK must serialize client events and capabilities from strict native types back into valid JSON.

## 4. The State Model Layer

The State Layer maintains a long-lived, mutable state object designed for high-performance updates.

### Design Principles
1.  **The "Add" Pattern**: Construction is separated from composition. Parent containers do not act as factories; they receive models to manage.
2.  **Standard Observer Pattern**: Models must provide a mechanism for the rendering layer to observe changes. 
    1.  **Low Dependency**: Prefer "lowest common denominator" mechanisms.
    2.  **Multi-Cast**: Support multiple listeners registered simultaneously.
    3.  **Unsubscribe Pattern**: There MUST be a clear way to stop listening.
    4.  **Payload Support**: Communicate specific data updates and lifecycle events.
    5.  **Consistency**: Used uniformly across `SurfaceGroupModel` (lifecycle), `SurfaceModel` (actions), `SurfaceComponentsModel` (lifecycle), `ComponentModel` (updates), and `DataModel` (data changes).
3.  **Granular Reactivity**: Updates are isolated.
    *   **Structure Changes**: `SurfaceComponentsModel` notifies when items are added/removed.
    *   **Property Changes**: `ComponentModel` notifies when its specific configuration changes.
    *   **Data Changes**: `DataModel` notifies only subscribers to the specific path that changed.

### State Models

#### `SurfaceGroupModel` & `SurfaceModel`
The root containers for active surfaces and their catalogs, data, and components.

```typescript
interface SurfaceLifecycleListener<T extends ComponentApi> {
  onSurfaceCreated?: (s: SurfaceModel<T>) => void;
  onSurfaceDeleted?: (id: string) => void;
}

/** 
 * Matches 'action' in specification/v0_9/json/client_to_server.json.
 */
interface A2uiClientAction {
  name: string;
  surfaceId: string;
  sourceComponentId: string;
  timestamp: string; // ISO 8601
  context: Record<string, any>;
}

class SurfaceGroupModel<T extends ComponentApi> {
  addSurface(surface: SurfaceModel<T>): void;
  deleteSurface(id: string): void;
  getSurface(id: string): SurfaceModel<T> | undefined;
  
  readonly onSurfaceCreated: EventSource<SurfaceModel<T>>;
  readonly onSurfaceDeleted: EventSource<string>;
  readonly onAction: EventSource<A2uiClientAction>;
}

class SurfaceModel<T extends ComponentApi> {
  readonly id: string;
  readonly catalog: Catalog<T>;
  readonly dataModel: DataModel;
  readonly componentsModel: SurfaceComponentsModel;
  readonly theme?: Record<string, any>;
  readonly sendDataModel: boolean;

  readonly onAction: EventSource<A2uiClientAction>;
  dispatchAction(payload: Record<string, any>, sourceComponentId: string): Promise<void>;
}
```

#### `SurfaceComponentsModel` & `ComponentModel`
Manages the adjacency list of component configurations.

```typescript
class SurfaceComponentsModel {
  get(id: string): ComponentModel | undefined;
  addComponent(component: ComponentModel): void;
  readonly onCreated: EventSource<ComponentModel>;
  readonly onDeleted: EventSource<string>;
}

class ComponentModel {
  readonly id: string;
  readonly type: string;
  get properties(): Record<string, any>;
  set properties(newProps: Record<string, any>);
  readonly onUpdated: EventSource<ComponentModel>;
}
```

#### `DataModel`
A dedicated store for application data supporting JSON Pointer ([RFC 6901]).

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

**Implementation Rules**:
1.  **Relative Paths**: A2UI extends JSON Pointer to support paths that do not start with `/` (e.g., `name`), resolving relative to the current scope.
2.  **Auto-vivification**: When setting a path like `/a/b/0/c`, create intermediate segments. If a segment is numeric, initialize as an Array `[]`, otherwise an Object `{}`.
3.  **Notification Strategy (Bubble & Cascade)**: Notify exact matches, bubble up to all parent paths, and cascade down to all nested descendant paths.
4.  **Undefined Handling**: Setting an object key to `undefined` removes it. Setting an array index to `undefined` preserves length but empties the index.

## 5. The Context & Evaluation Layer

Transient objects created on-demand during rendering to handle evaluation scope and binding resolution.

### `DataContext`
The primary interface for resolving `DynamicValue`s (literals, paths, function calls).

```typescript
class DataContext {
  readonly path: string; // Evaluation scope
  resolveDynamicValue<V>(v: DynamicValue): V;
  subscribeDynamicValue<V>(v: DynamicValue, onChange: (v: V | undefined) => void): Subscription<V>;
  nested(relativePath: string): DataContext; // Creates a child scope for templates
}
```

### `ComponentContext`
Pairs a component's specific configuration with its scoped `DataContext`.

```typescript
class ComponentContext<T extends ComponentApi> {
  readonly componentModel: ComponentModel;
  readonly dataContext: DataContext;
  readonly surfaceComponents: SurfaceComponentsModel; // The escape hatch
  dispatchAction(action: Record<string, any>): Promise<void>;
}
```

*Escape Hatch*: Component implementations can use `ctx.surfaceComponents` to inspect the metadata of other components in the same surface (e.g. a `Row` checking if children have a `weight` property). This is discouraged but necessary for some layout engines.

## 6. Message Processing (`MessageProcessor`)

The "Controller" that accepts the raw stream, parses messages, and mutates models.

```typescript
class MessageProcessor<T extends ComponentApi> {
  readonly model: SurfaceGroupModel<T>;
  
  constructor(catalogs: Catalog<T>[], actionHandler: ActionListener);

  // Accepts validated, strongly-typed message objects, not raw JSON
  processMessages(messages: A2uiMessage[]): void;
  addLifecycleListener(l: SurfaceLifecycleListener<T>): () => void;
  
  // Returns a strictly typed capabilities object ready for JSON serialization
  getClientCapabilities(options?: CapabilitiesOptions): A2uiClientCapabilities;
  
  /**
   * Returns the aggregated data model for all surfaces that have 'sendDataModel' enabled.
   * This should be used by the transport layer to populate metadata (e.g., 'a2uiClientDataModel').
   */
  getClientDataModel(): A2uiClientDataModel | undefined;
}
```

### Client Data Model Synchronization
When `sendDataModel: true`, the SDK aggregates the full state of enabled surfaces. The **Transport Layer** calls `getClientDataModel()` before sending any message to the server to populate metadata (e.g., `a2uiClientDataModel`).

### Capability Generation
To generate `a2uiClientCapabilities` (specifically `inlineCatalogs`):
1.  **Translation**: Convert internal component, function, and theme schemas into raw JSON Schema.
2.  **Envelope**: Wrap component schemas in the A2UI envelope (`allOf` containing `ComponentCommon`).
3.  **REF: Tagging**: Shared types (like `DynamicString`) are "tagged" in their description (e.g., `REF:common_types.json#/$defs/DynamicString`). The processor must traverse generated schemas, strip the tag, and replace the node with a valid JSON Schema `$ref`.

## 7. The Catalog & Function API

A catalog groups component definitions and function definitions together, along with an optional theme schema.

### `ComponentApi`
The framework-agnostic definition of a component.
```typescript
interface ComponentApi {
  readonly name: string;
  readonly schema: Schema; // Zod/Pydantic/etc.
}
```

### Functions
Functions accept statically resolved values as input arguments (not observable streams). However, they can return an observable stream (or Signal) to provide reactive updates to the UI, or they can simply return a static value synchronously.

Functions generally fall into a few common patterns:
1.  **Pure Logic (Synchronous)**: Functions like `add` or `concat`. Their logic is immediate and depends only on their inputs. They typically return a static value.
2.  **External State (Reactive)**: Functions like `clock()` or `networkStatus()`. These return long-lived streams that push updates to the UI independently of data model changes.
3.  **Effect Functions**: Side-effect handlers (e.g., `openUrl`, `closeModal`) that return `void`. These are triggered by user actions rather than interpolation.

If a function returns a reactive stream, it MUST use an idiomatic listening mechanism that supports standard unsubscription. To properly support an AI agent, functions SHOULD include a schema to generate accurate client capabilities.

### Composing Your Own Catalog
You can define your own catalog by composing components and functions that reflect your design system. While you can build a catalog entirely from scratch, you can also import or combine definitions with the Basic Catalog to save time.

*Example of composing a catalog:*
```python
# Pseudocode
myCustomCatalog = Catalog(
  id="https://mycompany.com/catalogs/custom_catalog.json",
  functions=basicCatalog.functions,
  components=basicCatalog.components + [MyCompanyLogoComponent()],
  themeSchema=basicCatalog.themeSchema # Inherit theme schema
)
```

### Expression Resolution (`formatString`)
Required logic for interpreting `${expression}` syntax.
*   **Recursion**: Must use `DataContext.resolveDynamicValue()` to evaluate nested expressions.
*   **Tokenization**: Distinguish between DataPaths (`${/path}`) and FunctionCalls (`${now()}`).

## 8. Standards & Type Coercion

### Implementation Separation
It is **crucial** to separate the pure API (the Schemas and `ComponentApi`) from the UI implementations. This allows a shared Core SDK to define the API once, while diverse UI Framework Adapters provide native view implementations.

### Type Coercion Table
| Input Type                 | Target Type | Result                                                                  |
| :------------------------- | :---------- | :---------------------------------------------------------------------- |
| `String` ("true", "false") | `Boolean`   | `true` or `false` (case-insensitive). Any other string maps to `false`. |
| `Number` (non-zero)        | `Boolean`   | `true`                                                                  |
| `Number` (0)               | `Boolean`   | `false`                                                                 |
| `Any`                      | `String`    | Locale-neutral string representation                                    |
| `null` / `undefined`       | `String`    | `""` (empty string)                                                     |
| `null` / `undefined`       | `Number`    | `0`                                                                     |
| `String` (numeric)         | `Number`    | Parsed numeric value or `0`                                             |

## 9. Agent Implementation Guide

If you are an AI Agent tasked with building a new Core SDK for A2UI, you MUST follow this strict, phased sequence of operations. Building a Core SDK requires a rigorous, test-driven approach. You can build and test it entirely in isolation before touching any UI code.

### Phase 1: Context to Ingest
Thoroughly review:
*   `specification/v0_9/docs/a2ui_protocol.md` (protocol rules)
*   `specification/v0_9/json/common_types.json` (dynamic binding types)
*   `specification/v0_9/json/server_to_client.json` (message envelopes)
*   `specification/v0_9/json/catalogs/minimal/minimal_catalog.json` (your initial target)

### Phase 2: Key Architecture Decisions (Write a Plan Document)
Create a comprehensive design document detailing:
*   **Dependencies**: Which Schema Library and Observable/Reactive Library will you use? *Note: Ensure your reactive library supports both discrete event subscription (EventEmitter style) and stateful, signal-like data streams (BehaviorSubject/Signal style).*
*   **STOP HERE. Ask the user for approval on this design document before proceeding.**

### Phase 3: Protocol Models & Serialization
Implement strict native types for all A2UI messages and metadata. Write the deserialization and validation logic.
*   **Action**: Write unit tests for JSON validation. Provide valid JSON strings and assert correct instantiation. Provide invalid JSON and assert `A2uiValidationError` is thrown.

### Phase 4: The Data Model
Implement the `DataModel` class. This is the most algorithmically complex layer.
*   **Action**: Write exhaustive unit tests for `DataModel`, especially JSON pointer resolution, auto-vivification (e.g. `/a/b/0/c`), and the cascade/bubble notification strategy. Ensure they pass before continuing.

### Phase 5: Component & Surface State Models
Implement `ComponentModel`, `SurfaceComponentsModel`, `SurfaceModel`, and `SurfaceGroupModel`.
*   **Action**: Write unit tests verifying that `SurfaceComponentsModel` properly adds, updates, and deletes components, emitting events for each. Test `SurfaceGroupModel` lifecycle management.

### Phase 6: The Context & Evaluation Layer
Implement `DataContext` and `ComponentContext` to handle path scoping and dynamic value resolution.
*   **Action**: Write unit tests for scoping (e.g. `nested("child").path`) and dynamic resolution with literals, DataBindings (`path`), and FunctionCalls (`call`).

### Phase 7: Message Processing
Implement the `MessageProcessor` to act as the central controller.
*   **Action**: Write unit tests passing a sequence of `createSurface`, `updateComponents`, and `updateDataModel` messages. Assert the final state of the models and verify `getClientDataModel()` correctly aggregates data for `sendDataModel: true`.

### Phase 8: Capabilities & Minimal Catalog Functions
The Minimal Catalog (`@specification/v0_9/json/catalogs/minimal/minimal_catalog.json`) is designed for rapid bootstrapping and testing. Target it first.
*   Implement the schema translation logic for `a2uiClientCapabilities` (stripping `REF:` tags and converting to `$ref`).
*   Implement the pure API schemas for the minimal catalog components (`Text`, `Row`, `Column`, `Button`, `TextField`).
*   Implement the `capitalize` function.
*   **Action**: Write unit tests verifying that standard function execution and capability generation work correctly.

### Phase 9: Basic Catalog Support
The Basic Catalog (`@specification/v0_9/json/basic_catalog.json`) is the ultimate standard that must be implemented for production renderers. Once the minimal architecture is proven robust, refer to the [Basic Catalog Implementation Guide](basic_catalog_implementation_guide.md) and:
*   Implement the full suite of basic functions. It is crucial to note that string interpolation and expression parsing should ONLY happen within the `formatString` function. Do not attempt to add global string interpolation to all strings.
*   Create definitions for the remaining Basic Catalog components.
*   **Action**: Look at existing reference implementations (e.g., `web_core`) to formulate and run comprehensive unit test cases for data coercion and function logic.

[RFC 6901]: https://datatracker.ietf.org/doc/html/rfc6901
