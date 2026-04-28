# A2UI Core SDK Implementation Guide

This document describes the architecture and implementation requirements for an A2UI Core SDK. The Core SDK is a framework-agnostic library responsible for state management, protocol parsing, and logic evaluation. It is designed to be implemented in any programming language (client or server) to provide a consistent foundation for A2UI-powered applications.

## 1. Role of the Core SDK

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
2.  **Granular Reactivity**: Updates are isolated.
    *   **Structure Changes**: `SurfaceComponentsModel` notifies when items are added/removed.
    *   **Property Changes**: `ComponentModel` notifies when its specific configuration changes.
    *   **Data Changes**: `DataModel` notifies only subscribers to the specific path that changed.

### State Models

#### `SurfaceGroupModel` & `SurfaceModel`
The root containers for active surfaces and their catalogs, data, and components.

```typescript
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
  readonly surfaceComponents: SurfaceComponentsModel; // For cross-component inspection
  dispatchAction(action: Record<string, any>): Promise<void>;
}
```

## 6. Message Processing (`MessageProcessor`)

The "Controller" that accepts the raw stream, parses messages, and mutates models.

### Client Data Model Synchronization
When `sendDataModel: true`, the SDK aggregates the full state of enabled surfaces. The **Transport Layer** calls `getClientDataModel()` before sending any message to the server to populate metadata (e.g., `a2uiClientDataModel`).

### Capability Generation
To generate `a2uiClientCapabilities` (specifically `inlineCatalogs`):
1.  **Translation**: Convert internal component, function, and theme schemas into raw JSON Schema.
2.  **Envelope**: Wrap component schemas in the A2UI envelope (`allOf` containing `ComponentCommon`).
3.  **REF: Tagging**: Shared types (like `DynamicString`) are "tagged" in their description (e.g., `REF:common_types.json#/$defs/DynamicString`). The processor must traverse generated schemas, strip the tag, and replace the node with a valid JSON Schema `$ref`.

## 7. The Catalog & Function API

A catalog defines the set of available components and functions.

### `ComponentApi`
The framework-agnostic definition of a component.
```typescript
interface ComponentApi {
  readonly name: string;
  readonly schema: Schema; // Zod/Pydantic/etc.
}
```

### Functions
Functions accept statically resolved values as input and can return a static value or a reactive stream (Signal).
1.  **Pure Logic**: Synchronous (e.g., `add`).
2.  **External State**: Reactive streams (e.g., `clock()`).
3.  **Effect Functions**: Side-effect handlers (e.g., `openUrl`) triggered by actions.

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

## 9. Phased Implementation Workflow

Building a Core SDK requires a rigorous, test-driven approach. Since the SDK is framework-agnostic, you can build and test it entirely in isolation before touching any UI code.

### Phase 1: Context Ingestion & Architecture
Review the protocol specifications (`a2ui_protocol.md`, `common_types.json`, `server_to_client.json`). Decide on your Schema Library and Observable/Reactive Library. Set up your unit testing framework.

### Phase 2: Protocol Models & Serialization
Implement strict native types for all A2UI messages and metadata. Write the deserialization and validation logic.
*   **Unit Tests (Exhaustive)**:
    *   Provide valid JSON strings for all message types and assert correct object instantiation.
    *   Provide invalid JSON (missing required fields, wrong types) and assert `A2uiValidationError` is thrown.
    *   Test client-to-server serialization (e.g., ensuring `A2uiClientAction` formats timestamps correctly).

### Phase 3: The Data Model
Implement the `DataModel` class. This is the most algorithmically complex layer.
*   **Unit Tests (Exhaustive)**:
    *   **Path Resolution**: Test setting/getting absolute paths (`/user/name`).
    *   **Auto-vivification**: Test setting deep paths (`/a/b/0/c`). Assert that `0` becomes an array and `b` becomes an object.
    *   **Deletion**: Test setting a path to `undefined`/`null`. Assert keys are removed from objects and indices are emptied in arrays.
    *   **Subscriptions**: Test that updating `/user/name` triggers subscribers for `/user/name` (exact), `/user` (bubble), and `/` (bubble), but not `/user/age` (sibling).

### Phase 4: Component & Surface State Models
Implement `ComponentModel`, `SurfaceComponentsModel`, `SurfaceModel`, and `SurfaceGroupModel`.
*   **Unit Tests (Exhaustive)**:
    *   Assert `SurfaceComponentsModel` properly adds, updates, and deletes components, emitting events for each.
    *   Test that replacing a component with a different `type` but the same `id` disposes the old model and creates a new one.
    *   Test `SurfaceGroupModel` lifecycle (adding/deleting surfaces and cascading disposal).

### Phase 5: The Context & Evaluation Layer
Implement `DataContext` and `ComponentContext` to handle path scoping and dynamic value resolution.
*   **Unit Tests (Exhaustive)**:
    *   **Scoping**: Test that `nested("child").path` resolves correctly against parent paths (handling trailing slashes).
    *   **Dynamic Resolution**: Test `resolveDynamicValue` with literals, DataBindings (`path`), and FunctionCalls (`call`).
    *   **Reactivity**: Test `subscribeDynamicValue` returning a stateful stream that updates when the underlying `DataModel` path is mutated.

### Phase 6: Message Processing
Implement the `MessageProcessor` to act as the central controller.
*   **Unit Tests (Exhaustive)**:
    *   Pass a sequence of `createSurface`, `updateComponents`, and `updateDataModel` messages. Assert the final state of the `SurfaceGroupModel`.
    *   Test that invalid message sequences (e.g., updating a surface before creating it) throw `A2uiStateError`.
    *   Test `getClientDataModel()` correctly aggregates data only for surfaces with `sendDataModel: true`.

### Phase 7: Capabilities & Catalog Functions
Implement the schema translation logic for `a2uiClientCapabilities` and standard function execution (e.g., `formatString`).
*   **Unit Tests (Exhaustive)**:
    *   **Capabilities**: Define a mock ComponentApi, generate capabilities, and assert the resulting JSON Schema is valid and that `REF:` tags are properly stripped and converted to `$ref` objects.
    *   **Functions**: Test `formatString` with mixed static text, absolute paths, relative paths, and nested function calls. Ensure missing values fail gracefully or coerce to empty strings.

[RFC 6901]: https://datatracker.ietf.org/doc/html/rfc6901
