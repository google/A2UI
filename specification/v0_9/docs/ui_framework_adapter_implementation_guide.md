# A2UI UI Framework Adapter Implementation Guide

This document describes how to implement an A2UI renderer for a specific UI framework (e.g., React, Flutter, Angular, SwiftUI). The Framework Adapter bridges the framework-agnostic **Core SDK** with native UI components to paint pixels on the screen.

## 1. Role of the Framework Adapter

The Framework Adapter handles the "Body" of the A2UI system. It consumes the reactive state provided by the Core SDK and transforms it into native widget trees.

Its primary responsibilities include:
*   **Rendering Loop**: Managing the recursive construction of the UI tree.
*   **Lifecycle Management**: Mounting and unmounting components and cleaning up subscriptions.
*   **Action Handling**: Connecting native UI events (clicks, input) to A2UI actions.
*   **Component Mapping**: Dispatching component types to their native implementations.

## 2. Implementation Topologies

Because A2UI spans multiple languages and UI paradigms, the strictness and location of the architectural boundaries between the Core SDK and the Framework Adapter will vary depending on the target ecosystem.

#### Dynamic Languages (e.g., TypeScript / JavaScript)
In highly dynamic ecosystems like the web, the architecture is typically split across multiple packages to maximize code reuse across diverse UI frameworks (React, Angular, Vue, Lit).
*   **Core Library (e.g., `web_core`)**: Implements the Core Data Layer, Component Schemas, and a Generic Binder Layer. Because TS/JS has powerful runtime reflection, the core library can provide a generic binder that automatically handles all data binding without framework-specific code. 
*   **Framework Adapter (e.g., `react_renderer`, `angular_renderer`)**: Implements the Framework-Specific Adapters and the actual view implementations.

#### Static Languages (e.g., Kotlin, Swift, Dart)
In statically typed languages, runtime reflection is often limited or discouraged for performance reasons.
*   **Core Library (e.g., `kotlin_core`)**: Implements the Core Data Layer and Component Schemas. The core library typically provides a manually implemented **Binder Layer** for the standard Basic Catalog components. This ensures that even in static environments, basic components have a standardized, framework-agnostic reactive state definition.
*   **Framework Adapter (e.g., `compose_renderer`)**: Uses the predefined Binders from the Core SDK to connect to native UI state and implements the actual visual components.

#### Combined Core + Framework Libraries (e.g., Swift + SwiftUI)
In ecosystems dominated by a single UI framework (like iOS with SwiftUI), developers often build a single, unified library rather than splitting the Core SDK and Framework Adapter into separate packages. In these cases, the generic `ComponentContext` and the framework-specific adapter logic are often tightly integrated.

## 3. The Rendering Architecture

The rendering flow follows a well-defined path:
1.  **The `Surface` Entry Point**: A native widget/view is instantiated with a `SurfaceModel`.
2.  **Observation**: The `Surface` listens to the `SurfaceModel` for structure changes.
3.  **Recursion**: The `Surface` initiates rendering at the component with ID `root`.
4.  **Component Rendering**: Each component uses its `ComponentContext` to resolve data and recursively call `buildChild(id)` for its children.

### The recursive `buildChild` helper
When implementing the recursive renderer, ensure it correctly propagates the data context path. If a nested component (like a Text field inside a List template) uses a relative path, it must resolve against the scoped path provided by its immediate parent (e.g., `/restaurants/0`), not the root path.

## 4. Component Implementation

Each A2UI component is defined by its implementation interface.

### Functional / Reactive Frameworks (e.g., Flutter, React)
```typescript
interface ComponentImplementation extends ComponentApi {
  /**
   * @param ctx The component's context containing its data and state.
   * @param buildChild A closure to recursively build children.
   */
  build(ctx: ComponentContext, buildChild: (id: string, basePath?: string) => NativeWidget): NativeWidget;
}
```

### Stateful / Imperative Frameworks (e.g., Vanilla DOM)
Stateful frameworks need a way to instantiate individual objects for each rendered component.
```typescript
interface ComponentInstance {
  mount(container: NativeElement): void;
  update(ctx: ComponentContext): void;
  unmount(): void;
}

interface ComponentImplementation extends ComponentApi {
  createInstance(ctx: ComponentContext): ComponentInstance;
}
```

## 5. Implementation Strategies

### Strategy 1: Direct / Binderless Implementation
The developer manually manages A2UI reactivity within the `build` method using native reactive tools (e.g., `useEffect` in React or `StreamBuilder` in Flutter).

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
To avoid repetitive subscription logic, use an intermediate **Binder Layer**. It transforms raw A2UI properties into a single stream of strongly-typed `ResolvedProps`.

```typescript
export interface ComponentBinding<ResolvedProps> {
  readonly propsStream: StatefulStream<ResolvedProps>;
  dispose(): void; // Cleans up data model subscriptions
}
```

### Strategy 3: Generic Binders (Dynamic Languages)
In languages with powerful reflection (like TypeScript), the Binder Layer can be automated. A generic factory inspects a component's schema and automatically creates data model subscriptions, allowing developers to write simple, stateless UI components.

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

## 6. Reactivity & Lifecycle Rules

Regardless of strategy, implementations MUST strictly manage subscriptions:
1.  **Lazy Subscription**: Only bind and subscribe to data when the component is actually mounted/attached to the UI.
2.  **Ownership**: 
    *   The **Core SDK** owns the `ComponentModel` (raw data state).
    *   The **Framework Adapter** owns the `ComponentContext` and `ComponentBinding`.
3.  **Path Stability**: If a property changes via an `updateComponents` message, you MUST unsubscribe from the old path before subscribing to the new one.
4.  **Destruction**: When a component or surface is removed, the adapter MUST dispose of all data model subscriptions to prevent memory leaks.

## 7. Advanced Framework Traits

### Contract of Ownership
A crucial part of A2UI's architecture is understanding who "owns" the data layers.
*   **The Data Layer (Message Processor) owns the `ComponentModel`**. It creates, updates, and destroys the component's raw data state based on the incoming JSON stream.
*   **The Framework Adapter owns the `ComponentContext` and `ComponentBinding`**. When the native framework decides to mount a component onto the screen (e.g., React runs `render`), the Framework Adapter creates the `ComponentContext` and passes it to the Binder. When the native framework unmounts the component, the Framework Adapter MUST call `binding.dispose()`.

### Data Props vs. Structural Props
It's important to distinguish between Data Props (like `label` or `value`) and Structural Props (like `child` or `children`).
*   **Data Props:** Handled entirely by the Binder. The adapter receives a stream of fully resolved values (e.g., `"Submit"` instead of a `DynamicString` path). Whenever a data value updates, the binder should emit a *new reference* (e.g. a shallow copy of the props object) to ensure declarative frameworks that rely on strict equality (like React) correctly detect the change and trigger a re-render.
*   **Structural Props:** The Binder does not attempt to resolve component IDs into actual UI trees. Instead, it outputs metadata for the children that need to be rendered.
    *   For a simple `ComponentId` (e.g., `Card.child`), it emits an object like `{ id: string, basePath: string }`.
    *   For a `ChildList` (e.g., `Column.children`), it evaluates the array. If the array is driven by a dynamic template bound to the data model, the binder must iterate over the array, using `context.dataContext.nested()` to generate a specific context for each index, and output a list of `ChildNode` streams. 
*   The framework adapter is then responsible for taking these node definitions and calling a framework-native `buildChild(id, basePath)` method recursively.

> **Implementation Tip: Context Propagation**
> When implementing the recursive `buildChild` helper, ensure that it correctly inherits the *current* component's data context path by default. If a nested component (like a Text field inside a List template) uses a relative path, it must resolve against the scoped path provided by its immediate structural parent (e.g., `/restaurants/0`), not the root path. Failing to propagate this context is a common cause of "empty" data in nested components.

### Reactive Validation (`Checkable`)
Components supporting the `checks` property should implement the `Checkable` trait:
*   **UI Feedback**: Reactively display the `message` of the first failing check.
*   **Action Blocking**: Actions (like Button clicks) should be disabled if validation fails.

## 8. Strongly-Typed Catalogs

The standard A2UI Basic Catalog specifies a set of core components (Button, Text, Row, Column) and functions.

### Strict API / Implementation Separation
When building libraries that provide the Basic Catalog, it is **crucial** to separate the pure API (the Schemas and `ComponentApi`/`FunctionApi` definitions) from the actual UI implementations.

*   **Multi-Framework Code Reuse**: In ecosystems like the Web, this allows a shared `web_core` library to define the Basic Catalog API and Binders once, while separate packages (`react_renderer`, `angular_renderer`) provide the native view implementations.
*   **Developer Overrides**: By exposing the standard API definitions, developers adopting A2UI can easily swap in custom UI implementations (e.g., replacing the default `Button` with their company's internal Design System `Button`) without having to rewrite the complex A2UI validation, data binding, and capability generation logic. 

For a detailed walkthrough on how to visually and functionally implement each basic component and function, refer to the [Basic Catalog Implementation Guide](basic_catalog_implementation_guide.md).

### Strictly Matching APIs
Platforms with strong type systems should utilize their features to ensure an adapter renderer strictly matches the official `ComponentApi` (name and schema). This catches spelling or schema mismatches at compile time.

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
  Button: ComponentImplementation & { name: "Button", schema: Schema },
  Text: ComponentImplementation & { name: "Text", schema: Schema },
  Row: ComponentImplementation & { name: "Row", schema: Schema },
  // ...
};

// If a developer forgets 'Row' or spells it wrong, the compiler throws an error.
const catalog = new Catalog("id", [
  implementations.Button,
  implementations.Text,
  implementations.Row
]);
```

## 9. Development Tools: The Gallery App

The Gallery App is the reference environment for an A2UI renderer.

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
Every renderer must verify:
*   **Layout Integrity**: Correct placement of Row/Column elements.
*   **Two-Way Binding**: TextField updates reflected in the Data Model viewer.
*   **Context Scoping**: Correct data resolution in nested templates (like Lists).

## 10. Agent Implementation Guide

If you are an AI Agent tasked with building a new A2UI renderer, you MUST follow this strict, phased sequence of operations. 

### Phase 1: Implement or Adopt a Core SDK
The framework adapter relies entirely on a stable, framework-agnostic data layer.
*   If a Core SDK already exists for your language (e.g., `@a2ui/web_core` for JS/TS), add it as a dependency.
*   If one does not exist, you **must** build it first. Follow the strict, test-driven phases outlined in the [Core SDK Implementation Guide](core_sdk_implementation_guide.md) before writing any UI code.

### Phase 2: Key Architecture Decisions (Write a Plan Document)
Before writing UI code, create a comprehensive design document detailing:
*   **Component Architecture**: How will you define the `ComponentImplementation` API for this language and framework?
*   **Surface Architecture**: How will the `Surface` framework entry point function to recursively build children?
*   **Binding Strategy**: Will you use an intermediate Generic Binder Layer (recommended for dynamic languages) or a Direct/Binderless implementation?
*   **STOP HERE. Ask the user for approval on this design document before proceeding.**

### Phase 3: Framework-Specific Layer
Implement the bridge between your models and the native UI.
*   Implement the `Surface` widget/view.
*   Establish lazy subscription mounting and disposal lifecycles to prevent memory leaks.

### Phase 4: Minimal Catalog Support
The Minimal Catalog (`@specification/v0_9/json/catalogs/minimal/minimal_catalog.json`) is designed for rapid bootstrapping and testing. Target it first.
*   Implement native UI support for a minimal set of components to verify the architecture: `Text`, `Row`, `Column`, `Button`, `TextField`.
*   **Action**: Verify that native properties update reactively when the underlying Core SDK data changes.

### Phase 5: Gallery Application (Milestone)
Build the **Gallery App** as described in Section 9. This tool is essential for debugging progressive rendering and two-way interaction logic before adding more complex components.
*   Load JSON samples from `specification/v0_9/json/catalogs/minimal/examples/`.
*   Verify progressive rendering and reactivity.
*   **STOP HERE. Ask the user for approval of the architecture and gallery application before proceeding to Phase 6.**

### Phase 6: Basic Catalog Support
The Basic Catalog (`@specification/v0_9/json/basic_catalog.json`) is the ultimate standard that must be implemented for production renderers. Once the core architecture is stable, refer to the [Basic Catalog Implementation Guide](basic_catalog_implementation_guide.md) to:
*   Implement the full suite of Basic Catalog widgets.
*   Bind all standard functions (arithmetic, logical, formatting) to the native UI components.
*   Update the Gallery App to load samples from `specification/v0_9/json/catalogs/basic/examples/`.

