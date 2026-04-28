# A2UI UI Framework Adapter Implementation Guide

This document describes how to implement an A2UI renderer for a specific UI framework (e.g., React, Flutter, Angular, SwiftUI). The Framework Adapter bridges the framework-agnostic **Core SDK** with native UI components to paint pixels on the screen.

## 1. Role of the Framework Adapter

The Framework Adapter handles the "Body" of the A2UI system. It consumes the reactive state provided by the Core SDK and transforms it into native widget trees.

Its primary responsibilities include:
*   **Rendering Loop**: Managing the recursive construction of the UI tree.
*   **Lifecycle Management**: Mounting and unmounting components and cleaning up subscriptions.
*   **Action Handling**: Connecting native UI events (clicks, input) to A2UI actions.
*   **Component Mapping**: Dispatching component types to their native implementations.

## 2. The Rendering Architecture

The rendering flow follows a well-defined path:
1.  **The `Surface` Entry Point**: A native widget/view is instantiated with a `SurfaceModel`.
2.  **Observation**: The `Surface` listens to the `SurfaceModel` for structure changes.
3.  **Recursion**: The `Surface` initiates rendering at the component with ID `root`.
4.  **Component Rendering**: Each component uses its `ComponentContext` to resolve data and recursively call `buildChild(id)` for its children.

### The recursive `buildChild` helper
When implementing the recursive renderer, ensure it correctly propagates the data context path. If a nested component (like a Text field inside a List template) uses a relative path, it must resolve against the scoped path provided by its immediate parent (e.g., `/restaurants/0`), not the root path.

## 3. Component Implementation

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

## 4. Implementation Strategies

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

## 5. Reactivity & Lifecycle Rules

Regardless of strategy, implementations MUST strictly manage subscriptions:
1.  **Lazy Subscription**: Only bind and subscribe to data when the component is actually mounted/attached to the UI.
2.  **Ownership**: 
    *   The **Core SDK** owns the `ComponentModel` (raw data state).
    *   The **Framework Adapter** owns the `ComponentContext` and `ComponentBinding`.
3.  **Path Stability**: If a property changes via an `updateComponents` message, you MUST unsubscribe from the old path before subscribing to the new one.
4.  **Destruction**: When a component or surface is removed, the adapter MUST dispose of all data model subscriptions to prevent memory leaks.

## 6. Advanced Framework Traits

### Data Props vs. Structural Props
*   **Data Props (e.g., `label`)**: Handled by the Binder/Adapter. The view receives fully resolved values. Whenever data updates, the binder should emit a *new reference* (shallow copy) to trigger declarative re-renders.
*   **Structural Props (e.g., `children`)**: The binder outputs metadata (`{ id, basePath }`). The adapter takes these and calls the framework-native `buildChild` method recursively.

### Reactive Validation (`Checkable`)
Components supporting the `checks` property should implement the `Checkable` trait:
*   **UI Feedback**: Reactively display the `message` of the first failing check.
*   **Action Blocking**: Actions (like Button clicks) should be disabled if validation fails.

## 7. Strongly-Typed Catalogs

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

## 8. Development Tools: The Gallery App

The Gallery App is the reference environment for an A2UI renderer.

### UX Architecture
*   **Left**: Sample Navigation.
*   **Center**: Surface Preview, JSON Message Stream, and an "Advance" stepper for progressive rendering verification.
*   **Right**: Live Data Model inspector and Action Logs.

### Integration Testing Requirements
Every renderer must verify:
*   **Layout Integrity**: Correct placement of Row/Column elements.
*   **Two-Way Binding**: TextField updates reflected in the Data Model viewer.
*   **Context Scoping**: Correct data resolution in nested templates (like Lists).

## 9. Phased Implementation Workflow

If you are building a new A2UI renderer, follow this strict, phased sequence of operations.

### Phase 1: Implement or Adopt a Core SDK
The framework adapter relies entirely on a stable, framework-agnostic data layer.
*   If a Core SDK already exists for your language (e.g., `@a2ui/web_core` for JS/TS), add it as a dependency.
*   If one does not exist, you **must** build it first. Follow the strict, test-driven phases outlined in the [Core SDK Implementation Guide](core_sdk_implementation_guide.md) before writing any UI code.

### Phase 2: Key Architecture Decisions
Before writing UI code, create a design document detailing:
*   **Component Architecture**: Define the `ComponentImplementation` API for your specific framework.
*   **Surface Architecture**: Design how the `Surface` entry point will recursively build children and propagate context.
*   **Binding Strategy**: Decide between a Generic Binder Layer (recommended for dynamic languages) or a Direct/Binderless implementation.

### Phase 3: Framework-Specific Layer
Implement the bridge between your models and the native UI.
*   Implement the `Surface` widget/view.
*   Establish lazy subscription mounting and disposal lifecycles to prevent memory leaks.

### Phase 4: Minimal Catalog Support
Implement native UI support for a minimal set of components to verify the architecture:
*   **Components**: `Text`, `Row`, `Column`, `Button`, `TextField`.
*   **Validation**: Verify that native properties update reactively when the underlying Core SDK data changes.

### Phase 5: Development Tools (Gallery App)
Build the **Gallery App** as described in Section 8. This tool is essential for debugging progressive rendering and two-way interaction logic before adding more complex components.

### Phase 6: Basic Catalog Support
Once the core architecture is stable, refer to the [Basic Catalog Implementation Guide](basic_catalog_implementation_guide.md) to:
*   Implement the full suite of Basic Catalog widgets.
*   Bind all standard functions (arithmetic, logical, formatting) to the native UI components.

