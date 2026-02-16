# Web renderer requirements for v0.9

# Terms
- web_core library: a shared library which implements web rendering functionality that is not specific to any particular web framework.
- framework renderer: The A2UI renderer for a specific framework, e.g. Angular, Lit etc.

The A2UI team will own the web_core library, lit renderer and angular renderer. We expect 5+ other rendering frameworks to be built on top of web_core by the community.

# High level requirements

## Centralised web_core library

The `web_core` library is a shared library that centralizes much of the logic requires to render A2UI content across different frameworks. It is responsible for:

  - **Source of truth for state**: Owning the internal state of each surface (e.g. components, data model)

  - **Processing server-to-client messages**: Processing A2UI messages and updating the internal state

  - **Outputting client-to-server messages**: Collecting up user interaction events from each surface and exposing them as a single stream to the agent

  - **Advertising Catalogs**: Surfacing the IDs and schemas for the available catalogs to the agent via `clientCapabilities`.
 
  - **Centralizing some standard catalog interfaces and logic**: Centralize logic so that framework renderer authors and developers can reimplement the standard catalog with minimal effort and errors. This includes:
    - The Catalog API, e.g. set of Components and functions that must be implemented
    - Partial implementation of each Component (e.g. the name, schema, and argument parsing logic), allowing framework authors and application developers to replace only the thin rendering layer.
    - Complete implementation of each Function

## Framework renderers (e.g. Lit and Angular)

The Framework Renderers are responsible for providing simple integration points between a host UI layout and an A2UI surface, and between an A2UI Catalog and a specific component implemented in a given web framework. These libraries should each depend on `web_core`.

They are responsible for:

- **Recursively rendering a `Surface`** based on the view hierarchy and data represented in a `SurfaceContext`

- **Exposing Component-specific data to each Component implementation** either by plumbing through `ComponentContext` or adapting it to framework-specific patterns and libraries.

- **Facilitating data subscriptions and re-rendering in a framework native way** so that when a component is updated or a relevant part of the data model changes, the UI is updated.

- **Managing the lifecycle of component instances** so that when components are deleted, all data model subscriptions etc are cancelled.

## Consistency with Flutter

The implementation must follow the Flutter Gen UI SDK's internal structure and APIs where these are not in conflict with web idioms or unique requirements. Note that renaming or restructuring parts of the Flutter API surface is permitted when a better common solution is found.

## Google monorepo compatibility

Code must be importable to Google's monorepo, which requires:
- Using explicit override modifiers and private keywords (no # syntax or accessors)
- Removing circular dependencies
- Avoiding banned APIs (e.g., unsafeHTML, unsafeCSS, iframes)
- Ensuring external dependencies like markdown-it and signal libraries are modularized or replaced with approved internal alternatives.

# User journeys

1. As an Angular or Lit application developer, I want to integrate A2UI rendering with the standard catalog into my application.

2. As an Angular or Lit application developer, I want to implement a new Component and add it to the Standard Catalog components to form a new Catalog.

3. As an Angular or Lit application developer, I want to reimplement a Component in the standard catalog to change the way it looks, while preserving the rest of the component implementations.
  
4. As a framework author, I want to implement a new A2UI renderer for a previously unsupported web framework which is consistent with the rest of the ecosystem.
  
5. As a framework author, I want to implement the standard catalog in an additional web framework in a way that has a consistent behavior and appearance to existing framework renderers.

# Overview of functionality

This section outlines the key components required for the web renderer. While the specific implementation details for the web are still being explored (prototype status), the Flutter implementation serves as a mature reference for the required functionality and API structure.

## Core APIs (should be in `web_core`)

These APIs should be included in the `web_core` library. We should make Flutter and Web versions consistent where possible, likely by adapting the existing Flutter API surface to Web.

### SurfaceController (A2uiMessageProcessor)

**Purpose**: The central controller for the A2UI runtime.

#### Flutter reference ([surface_controller.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/engine/surface_controller.dart))

```dart
class SurfaceController implements SurfaceHost, A2uiMessageSink {
  /// Process an [message] from the AI service.
  void handleMessage(A2uiMessage message);

  /// A stream of messages to be submitted to the AI service (e.g. user actions).
  Stream<ChatMessage> get onSubmit;

  /// Returns a [SurfaceContext] for the surface with the given [surfaceId].
  SurfaceContext contextFor(String surfaceId);
}
```

*Missing Functionality in Reference:*
- **Capabilities Generation**: The v0.9 spec requires the client to send a `clientCapabilities` object (including supported catalogs) in the transport metadata. The controller needs a method to generate this object based on the registered catalogs.

### SurfaceContext

**Purpose**: Encapsulates the complete state and configuration for a single A2UI surface. It acts as the "model" for the `Surface` UI component.

**Responsibilities**:
- **State Container**: Holds the Data Model instance for the surface.
- **Component Definitions**: Stores the current snapshot of component definitions.
- **Catalog Reference**: Holds a reference to the Catalog instance used by this surface.
- **Action Dispatch**: Provides a method that components use to send user interactions to the host application's action handler.

#### Flutter reference ([surface_context.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/interfaces/surface_context.dart))

```dart
abstract interface class SurfaceContext {
  /// The ID of the surface this context is bound to.
  String get surfaceId;

  /// The current definition of the UI for this surface.
  ValueListenable<UiDefinition?> get definition;

  /// The data model for this surface.
  DataModel get dataModel;

  /// The catalogs available to this surface.
  Iterable<Catalog> get catalogs;

  /// Handles a UI event from this surface.
  void handleUiEvent(UiEvent event);
}
```

*Missing Functionality in Reference:*
- **Theme Access**: Explicit exposure of the `theme` object received in the `createSurface` message, to be used by the Surface renderer.

#### v0.8 references**
- [Core: types.ts - Surface interface defining the state of a surface](https://github.com/google/A2UI/blob/main/renderers/web_core/src/v0_8/types/types.ts)

### ComponentContext (CatalogItemContext)

**Purpose**: Provides the runtime context necessary for a single component instance to render itself. It isolates the component from the global state while providing controlled access to what it needs.

**Responsibilities**:
- **Property Access**: Exposes the raw properties of the component.
- **Child Rendering**: Provides methods to recursively build sub-components.
- **Data Access**: Provides access to the scoped `DataContext`.
- **Event Dispatch**: Exposes a method to dispatch events.

#### Flutter reference ([catalog_item.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/catalog_item.dart))

```dart
class CatalogItemContext {
  /// The parsed data for this component from the AI-generated definition.
  final Object data;

  /// The unique identifier for this component instance.
  final String id;

  /// Callback to build a child widget by its component ID.
  final ChildBuilderCallback buildChild;

  /// The [DataContext] for accessing and modifying the data model.
  final DataContext dataContext;

  /// Callback to dispatch UI events (e.g., button taps) back to the system.
  final DispatchEventCallback dispatchEvent;
}
```

*Missing Functionality in Reference:*
- **Unified Resolution**: A `resolve<T>()` helper method that uniformly handles literal values, data bindings (JSON pointers), *and* function calls. Currently, Flutter often handles bindings manually in widgets.

**v0.8 references**:
- [Lit: root.ts - Root class acts as the base component context](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/root.ts)
- [Angular: dynamic-component.ts - Base class providing context to components](https://github.com/google/A2UI/blob/main/renderers/angular/src/lib/rendering/dynamic-component.ts)

### DataContext

**Purpose**: A scoped view into the `DataModel`. It allows components to access and modify data using relative paths, which is essential for components inside repeaters (like `List` or `Column` templates).

**Responsibilities**:
- **Path Resolution**: Resolves relative paths (e.g., `name`) to absolute paths.
- **Data Access**: Provides methods to get values and subscribe to changes in the `DataModel`.
- **Updates**: Provides methods to modify the `DataModel`.
- **Nesting**: Can create a nested `DataContext` for a new scope.

#### Flutter reference ([data_model.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/data_model.dart))

```dart
class DataContext {
  /// Subscribes to a path or expression, resolving it against the current context.
  ValueNotifier<T?> subscribe<T>(String pathOrExpression);

  /// Updates the data model, resolving the path against the current context.
  void update(String pathStr, Object? contents);

  /// Creates a new, nested DataContext for a child widget.
  DataContext nested(String relativePath);
}
```

*Missing Functionality in Reference:*
- **Function Call Support**: Support for resolving `FunctionCall` objects directly within the data context, if this is where the architectural decision places logic resolution.

**v0.8 references**:
- [Core: types.ts - BaseComponentNode definition includes dataContextPath](https://github.com/google/A2UI/blob/main/renderers/web_core/src/v0_8/types/types.ts)

## Framework-specific APIs (should be in Lit/Angular renderers)

These are classes and APIs which are specific to the rendering framework (Lit, Angular, etc.), because they interact directly with the rendering primitives.

### Catalog

**Purpose**: Completely encapsulates support for a specific set of UI components. It decouples the core rendering engine from the specific widgets it can render.

Notes:
- Each`A2uiMessageProcessor` can support multiple catalogs, but the surface can only support a single catalog which is determined by the `CreateSurface` message. Ideally, `A2uiMessageProcessor` can determine the catalog instance and pass it to `Surface` via `SurfaceContext`.

#### Flutter reference ([catalog.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/catalog.dart))

```dart
class Catalog {
  /// The list of [CatalogItem]s available in this catalog.
  final Iterable<CatalogItem> items;

  /// A string that uniquely identifies this catalog.
  final String? catalogId;

  /// A dynamically generated [Schema] that describes all widgets in the catalog.
  Schema get definition;
}
```

*Missing Functionality in Reference:*
- **Function Registry**: The `Catalog` class should include a definition of `functions` supported by this catalog (e.g. `required`, `regex`, `formatString`), so they can be advertised in the client capabilities.

**v0.8 references**:
- [Angular: catalog.ts - Defines the Catalog interface and injection token](https://github.com/google/A2UI/blob/main/renderers/angular/src/lib/rendering/catalog.ts)
- [Angular: default.ts - Default catalog implementation](https://github.com/google/A2UI/blob/main/renderers/angular/src/lib/catalog/default.ts)
- [Lit: component-registry.ts - Dynamic component registry (partial equivalent)](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/component-registry.ts)

### Component (CatalogItem)

Concretely, these libraries must contain:

  - A `Surface` class which represents an A2UI surface that can be placed in a UI.

  - A specialized `CatalogItem` (a.k.a. `Component`) interface which allows developers to implement new Components in the framework. This API must expose the relevant A2UI state (e.g. component properties, data model) to the rendering logic.

  - A specialized `Catalog` interface, or a templated instance of a Core `Catalog` interface, which can contain a set of the specialized Catalog objects.

**Purpose**: Centralize everything that is needed to support a specific Component in an A2UI renderer, including rendering componentUpdate messages that refer to this component, and advertising the component to agents via an inline catalog.

Notes:
- This class may need to be framework-specific, because it implements rendering which can vary between frameework, though ideally it (and `Catalog`) implement some standard interface that allows the generic `A2uiMessageProcesser` to access the schema from each component in order to create inline catalogs. This could be achieved via some narrow interface, or by using one shared class that is templated.
- In some cases, a catalog may need to be implemented for many different rendering frameworks (e.g. the standard catalog). In this case, it would be helpful if at least the parsing logic for each component could be shared between each framework, to avoid duplicated and inconsistent code.

#### Flutter reference ([catalog_item.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/catalog_item.dart))

```dart
class CatalogItem {
  /// The widget type name used in JSON, e.g., 'Text'.
  final String name;

  /// The schema definition for this widget's data, which is used for validation,
  /// and to advertise the component in inline catalogs.
  final Schema dataSchema;

  /// The builder for this widget.
  final CatalogWidgetBuilder widgetBuilder;
}
```

*Missing Functionality in Reference:*
- **Properties Schema**: The `CatalogItem` currently defines the full schema. For v0.9, it might be beneficial to separate the component's properties schema (used for validation) from the full JSON schema generation to make it easier to maintain.

**v0.8 references**:
- [Core: types.ts - Component node type definitions (e.g. ButtonNode)](https://github.com/google/A2UI/blob/main/renderers/web_core/src/v0_8/types/types.ts)
- [Lit: button.ts - Button implementation](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/button.ts)
- [Angular: button.ts - Button implementation](https://github.com/google/A2UI/blob/main/renderers/angular/src/lib/catalog/button.ts)

### Surface

**Purpose**: This is the actual UI component/widget that developers drop into their application. It bridges the `web_core` state to the framework's view hierarchy.

**Requirements**:
- **Input**: Must accept a `SurfaceContext`.
- **Reactivity**: Must subscribe to changes in the `SurfaceContext` and trigger a re-render.
- **Root Rendering**: Must identify the 'root' component and initiate rendering.

#### Flutter reference ([surface.dart](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/widgets/surface.dart))

```dart
class Surface extends StatefulWidget {
  /// The context that holds the state of this surface.
  final SurfaceContext genUiContext;
}
```

**v0.8 references**:
- [Lit: surface.ts - Surface component](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/surface.ts)
- [Angular: surface.ts - Surface component](https://github.com/google/A2UI/blob/main/renderers/angular/src/lib/catalog/surface.ts)

# Details of Component (CatalogItem) requirements

The Component is the prototype object for a specific UI element that can be rendered.

## Inputs and dependencies

A component's render method receives a Context object which provides:
- **`id`**: The component's unique ID.
- **`properties`**: The raw JSON properties map for this component instance.
- **`dataContext`**: The scoped data access object.
- **`surfaceContext`**: Access to global surface info.
- **`renderChild`**: A helper to build a child component.
- **`dispatchAction`**: A helper to send events.

## Functionality

1.  **Property Decoding**: Read values from `properties`.
2.  **Resolution**: Resolve dynamic values (literals or data bindings) using the Data Context. This should handle setting up subscriptions for reactivity.
3.  **Child Composition**: If the component is a container, use helper methods to generate the output for its children.
4.  **Interaction**: Wire up UI events to update the Data Model or dispatch server actions.
5.  **Output Generation**: Return the framework-specific render output.

## Types of changes that can occur

### Component definition update via updateComponent message
- **Trigger**: The server sends a new definition for the component.
- **Handling**: The framework re-renders the component with the new properties.

### Updates to data model
- **Trigger**: The server sends `updateDataModel`, or a local user interaction updates the model.
- **Handling**: Subscriptions created during resolution are notified. The framework re-renders the specific component (or the Surface).

### Component is deleted
- **Trigger**: A parent container's `children` list is updated to remove this component ID.
- **Handling**: The component is removed from the UI tree. Subscriptions should be cleaned up.

# Details of Surface

The Surface is the entry point for rendering an A2UI interface within the host application. It is responsible for bridging the internal A2UI state with the native UI framework's rendering tree.

## Inputs
- **Surface State**: A reference to the `SurfaceContext` object, which contains the Data Model, component definitions, and configuration for the specific surface to be rendered.

## Responsibilities

### Root Resolution
The Surface must identify the entry point of the UI tree. It does this by looking for the component with the ID `root` within the `SurfaceContext`.

### Hierarchy Construction
Rendering is a recursive process:
1.  **Context Creation**: The Surface creates the initial runtime context (Component Context and Data Context) for the root component.
2.  **Component Lookup**: It retrieves the concrete implementation of the component from the `Catalog` using the type defined in the root component's definition.
3.  **Rendering**: It invokes the component's render method.
4.  **Recursion**: If the root component contains children (e.g., a Column or Row), it uses the context to resolve and render those children, repeating the process down the tree.

### Reactivity & Updates
The Surface acts as the root observer. It must subscribe to changes in the `SurfaceContext` (such as when the component tree structure is updated by the server) and trigger a re-render of the UI. Additionally, depending on the framework's change detection strategy, it may need to facilitate the propagation of Data Model updates to the individual components.

# Renderer structure differences

 - **Centralization**: v0.9 centralizes state management (`DataModel`, `SurfaceContext`) and message processing in `web_core`. v0.8 scattered this logic across renderers.
    - *v0.8*: [Lit renderer handling state](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/surface.ts) vs [Angular renderer handling state](https://github.com/google/A2UI/blob/main/renderers/angular/src/lib/catalog/surface.ts) (duplicated logic).
    - *v0.9*: [Flutter SurfaceController (centralized logic)](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/engine/surface_controller.dart).

 - **Component Implementation**: v0.9 removes the strictly typed "Node" intermediate representation (`AnyComponentNode`). Components now validate raw JSON properties using Zod schemas at runtime via `ComponentContext`.
    - *v0.8*: [Strict Node types in web_core](https://github.com/google/A2UI/blob/main/renderers/web_core/src/v0_8/types/types.ts).
    - *v0.9*: [Flutter CatalogItemContext (runtime validation)](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/catalog_item.dart).

 - **Catalog Management**: v0.9 uses `Catalog` instances passed to the surface, allowing for easy composition and scoping. v0.8 relied on global or static registries.
    - *v0.8*: [Lit static global registry](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/component-registry.ts).
    - *v0.9*: [Flutter Catalog instance](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/catalog.dart).

 - **Reactivity**: v0.9 introduces explicit `Subscription` management within `web_core`. `ComponentContext.resolve()` automatically subscribes components to data changes, whereas v0.8 required manual binding logic within component implementations.
    - *v0.8*: [Lit manual binding in Text component](https://github.com/google/A2UI/blob/main/renderers/lit/src/0.8/ui/text.ts).
    - *v0.9*: [Flutter DataContext.subscribe](https://github.com/flutter/genui/blob/feature/v0.9-migration/packages/genui/lib/src/model/data_model.dart).

# Specification Comparison: v0.8 vs v0.9

## Message Structure (Superficial Change)
The message types have been renamed to be more verb-oriented, but the underlying flow remains similar.

| Feature            | v0.8              | v0.9               |
| :----------------- | :---------------- | :----------------- |
| **Initialization** | `beginRendering`  | `createSurface`    |
| **UI Update**      | `surfaceUpdate`   | `updateComponents` |
| **Data Update**    | `dataModelUpdate` | `updateDataModel`  |
| **Deletion**       | `deleteSurface`   | `deleteSurface`    |

## Component Definition (Moderate Change)
- **Nesting:**
  - **v0.8:** Uses a wrapper object pattern to support `oneOf` schemas.
    ```json
    { "id": "1", "component": { "Text": { "text": ... } } }
    ```
  - **v0.9:** Uses a flat object with a discriminator property (`component`), reducing token count and complexity.
    ```json
    { "id": "1", "component": "Text", "text": ... }
    ```
- **Children:**
  - **v0.8:** The `children` property was an object containing *either* `explicitList` OR `template`.
  - **v0.9:** The `children` property is polymorphic. It can be a simple array of IDs `["a", "b"]` OR a template object `{ "path": "...", "componentId": "..." }`.

## Data Model & Binding (Deep Change)
- **Data Updates:**
  - **v0.8:** Used a typed adjacency list to represent data updates (e.g., `contents: [{"key": "name", "valueString": "Bob"}]`). This was verbose but type-safe.
  - **v0.9:** Uses standard JSON values and JSON Pointer paths (e.g., `value: "Bob", path: "/name"`). This allows replacing entire sub-trees of the data model easily.
- **Binding:**
  - **v0.8:** Properties used a `BoundValue` wrapper (e.g., `{ "literalString": "Hello" }` or `{ "path": "/user/name" }`).
  - **v0.9:** Properties use a `DynamicValue` type. This can be a raw literal (e.g. `"Hello"`), a path object (`{ "path": "/user/name" }`), or a **Function Call** (`{ "call": "formatString", ... }`).
- **String Interpolation:**
  - **v0.8:** Not supported natively.
  - **v0.9:** Supported via the `formatString` function and `${...}` syntax, allowing complex compositions like `"Hello ${/user/name}"`.

## Function & Validation Support (New Feature)
- **Functions:** v0.9 introduces a `functions` section in the catalog. Clients must implement standard functions (e.g., `required`, `regex`, `formatString`, `pluralize`) that can be invoked by the server logic.
- **Client-Side Validation:** Components in v0.9 can define a `checks` property, which is a list of function calls that must return `true`. This allows for robust client-side form validation (e.g., checking regex or required fields) without a round-trip to the server.
- **Actions:** v0.8 actions were purely server-side. v0.9 splits `action` into `event` (server-side) and `functionCall` (client-side), enabling local interactivity (e.g., `openUrl`).

## Standard Catalog Changes (Moderate Change)
- **New Components:** `ChoicePicker` (replaces `MultipleChoice`), `Slider` (updated).
- **Renamed/Changed:**
  - `MultipleChoice` -> `ChoicePicker`.
  - `Button`: Now supports `variant` ("primary", "borderless") instead of `primary` boolean.
  - `TextField`: `textFieldType` renamed to `variant`.
- **Theme:** v0.9 introduces a `theme` property in `createSurface` and the catalog, allowing control over `primaryColor`, `iconUrl`, and `agentDisplayName`.
