# A2UI Catalog API Architecture Proposal (v0.9)

## Objective
To refine the A2UI client-side Catalog API to clearly separate component schema definitions, data decoding logic, and framework-specific rendering. This will improve code sharing across frameworks, enhance type safety when implementing catalogs, and provide a streamlined, idiomatic developer experience for creating custom components.

## Use Cases
This architecture is designed to support the following scenarios when working with Catalogs:
- Declare a Component or Catalog with a fixed API which could have multiple implementations.
- Implement a Component from scratch with a new API and new one-off implementation
- Implement a Component based on an API which is defined elsewhere
- Implement a Component using an API and a binder layer already implemented, and potentially shared across different UI frameworks for the same language
- Implement an entire Catalog to match a predefined Catalog API, with type safety to ensure I include all the correct components and schemas

## Requirements Addressed

1.  **Share Component Schemas**: Allow developers to declare component schemas independently so they can be reused across different platform implementations.
2.  **Share Decoding Logic**: Centralize the boilerplate of resolving `DynamicValue` properties, handling reactive streams, and tracking subscriptions into a framework-agnostic "Binder" layer. Provide details on how a generic binder can be built using Zod for web environments.
3.  **Reliable Catalog Implementation**: Provide a strongly-typed mechanism to ensure a specific framework implementation covers all required components of a defined catalog (e.g., ensuring `createAngularBasicCatalog` includes a renderer for `Button`, `Text`, etc.).
4.  **Framework-Specific Adapters**: Provide idiomatic APIs for specific frameworks (e.g., a React adapter and an Angular adapter that provide standard framework props/inputs instead of raw `ComponentContext`).
5.  **Streamlined DX (Stretch Goal)**: Explore a `defineCatalogImplementation` API for defining catalogs quickly with high type safety.

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

## Proposed Architecture: The 4-Layer Model

We propose breaking down the component lifecycle into four distinct layers:

### 1. Component Schema (API Definition)
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

*Note for Swift/Kotlin:* In Swift, this would be represented by `Codable` structs mapping to the JSON structure. In Kotlin, this would be `kotlinx.serialization` classes. The architectural separation of concerns remains identical.

### 2. The Binder Layer (Framework-Agnostic)
A2UI components are heavily reliant on `DynamicValue` bindings, which must be resolved into reactive streams. Framework renderers currently have to manually resolve these, manage context, and handle the lifecycle of data subscriptions. 

The **Binder Layer** absorbs this responsibility. It takes the raw component properties and the `ComponentContext`, and transforms the reactive A2UI bindings into a single, cohesive stream of strongly-typed `ResolvedProps`.

#### Subscription Lifecycle and Cleanup
A critical responsibility of the Binding is tracking all subscriptions it creates against the underlying data model. As outlined in the Contract of Ownership (see Framework-Specific Adapters), the framework adapter manages the lifecycle of the Binding. When a component is removed from the UI (because its parent was replaced, the surface was deleted, etc.), the framework adapter must call the Binding's `dispose()` method. The Binding then iterates through its internally tracked subscription list and severs them, ensuring that no dangling listeners remain attached to the global `DataModel`.

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

*Note for Static Languages (Swift/Kotlin):* Dynamic runtime reflection isn't as easily feasible. Swift/Kotlin environments can rely on Code Generation (Swift Macros, KSP) to generate the boilerplate `Binding` logic based on the schema at compile-time.

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

### 3. Framework-Specific Adapters
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
    *   For a `ChildList` (e.g., `Column.children`), it evaluates the array and emits a `ChildNode[]` stream. If the `ChildList` is a template, the Binder subscribes to the array in the `DataModel` and maps each item to `{ id: templateId, basePath: '/path/to/item/index' }`. 
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

### 4. Strongly-Typed Catalog Implementations
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

## Streamlined DX: The `defineCatalog` Approach

To provide a super streamlined, `json-render`-style API for TypeScript users, we can build abstraction helpers on top of the Binder architecture. This avoids the boilerplate of defining schemas, binders, and implementations across multiple files.

### Conceptual Streamlined API (TypeScript Web Core)

Using the generic `ZodBinder` capability, we can construct the API directly mapping to standard A2UI types (`ChildListSchema`, `ComponentIdSchema`).

**1. Defining the Catalog API & Schemas:**
```typescript
export const myCatalogDef = defineCatalogApi({
  id: "my-custom-catalog",
  components: {
    Card: {
      props: z.object({ 
        title: DynamicStringSchema,
        description: DynamicStringSchema.optional(),
        child: ComponentIdSchema // Explicit A2UI component relationship
      })
    },
    Button: {
      props: z.object({
        label: DynamicStringSchema,
        action: ActionSchema
      })
    }
  }
});
```

**2. Implementing the React Catalog:**
The `defineCatalogImplementation` function automatically generates the generic `Binding` under the hood based on the Zod schema provided in step 1, resolving dynamic values into static values passed directly to the render function.

For structural links like `ChildList` or `ComponentId`, the framework adapter automatically intercepts these properties and provides framework-native rendering helpers (like `renderChild(props.child)`).

```typescript
export const myReactCatalog = defineCatalogImplementation(myCatalogDef, {
  components: {
    // `props` here are fully resolved strings and callbacks!
    // `renderChild` is injected by the adapter to render A2UI children.
    Card: ({ props, renderChild }) => (
      <div className="card">
        <h2>{props.title}</h2>
        {props.description && <p>{props.description}</p>}
        {renderChild(props.child)}
      </div>
    ),

    Button: ({ props }) => (
      <button onClick={() => props.action()}>
        {props.label}
      </button>
    )
  },
  functions: {
    submit_form: async (params, context) => { ... }
  }
});
```

## Summary of Changes to the Renderer Guide

To implement these updates in `renderer_guide.md`, we will:

1.  **Introduce the Binder Layer Concept**: Detail that frameworks should not manually subscribe to `DataModel` paths. Instead, they should utilize a shared `ComponentBinder` layer that outputs a framework-agnostic reactive stream of resolved properties (`ComponentBinding`).
2.  **Define Framework Adapters**: Add guidance on creating framework-specific adapters (e.g., React and Angular) that handle the lifecycle of the Binding (subscription and disposal) and map its stream to native framework reactivity paradigms.
3.  **Strict Catalog Typing Strategy**: Recommend that Catalog implementations expose a generic `CatalogImplementation<T>` mapping interface so compiler errors enforce that implementations strictly match the required schema and naming signatures.
4.  **Mention Advanced DX Utilities**: Outline how TypeScript implementations can leverage schema-reflection via Zod to auto-generate Binders (`createZodBinding`), while static languages can rely on code-generation for streamlined development.