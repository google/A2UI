# A2UI Catalog API Architecture Proposal (v0.9)

## Objective
To refine the A2UI client-side Catalog API to clearly separate component schema definitions, data decoding logic, and framework-specific rendering. This will improve code sharing across frameworks, enhance type safety when implementing catalogs, and provide a streamlined, idiomatic developer experience for creating custom components.

## Requirements Addressed

1.  **Share Component Schemas**: Allow developers to declare component schemas independently so they can be reused across different platform implementations.
2.  **Share Decoding Logic**: Centralize the boilerplate of resolving `DynamicValue` properties, handling reactive streams, and tracking subscriptions into a framework-agnostic "Decoder" layer. Provide details on how a generic decoder can be built using Zod for web environments.
3.  **Reliable Catalog Implementation**: Provide a strongly-typed mechanism to ensure a specific framework implementation covers all required components of a defined catalog (e.g., ensuring `createAngularBasicCatalog` includes a renderer for `Button`, `Text`, etc.).
4.  **Framework-Specific Adapters**: Provide idiomatic APIs for specific frameworks (e.g., a React adapter and an Angular adapter that provide standard framework props/inputs instead of raw `ComponentContext`).
5.  **Streamlined DX (Stretch Goal)**: Explore a `defineCatalogImplementation` API for defining catalogs quickly with high type safety.

---

## Proposed Architecture: The 4-Layer Model

We propose breaking down the component lifecycle into four distinct layers:

### 1. Component Schema (API Definition)
This layer defines the exact JSON footprint of a component without any rendering or decoding logic. It is the single source of truth for the component's contract, exactly mirroring the A2UI component schema definitions.

```typescript
// basic_catalog_api/schemas.ts
export interface ComponentDefinition<Name extends string, PropsSchema extends z.ZodTypeAny> {
  name: Name;
  schema: PropsSchema;
}

const ButtonSchema = z.object({
  label: DynamicStringSchema,
  action: ActionSchema,
});

// Example definition
export const ButtonDef: ComponentDefinition<"Button", typeof ButtonSchema> = {
  name: "Button",
  schema: ButtonSchema
};
```

### 2. The Decoder Layer (Framework-Agnostic)
A2UI components are heavily reliant on `DynamicValue` bindings (which resolve to reactive streams). Framework renderers currently have to manually resolve these, manage context, and handle subscriptions. The **Decoder Layer** absorbs this responsibility. 

A Decoder takes the raw `ComponentContext` and transforms the reactive A2UI bindings into a single, cohesive stream of strongly-typed `ResolvedProps`.

```typescript
// The generic Decoder interface
export interface ComponentDecoder<ResolvedProps> {
  // A stream of fully resolved, ready-to-render props
  readonly propsStream: Observable<ResolvedProps>;
  // Cleans up all underlying data model subscriptions
  dispose(): void;
}

// The Middle Layer combining Schema + Decoder Logic
export interface FrontEndLayer<RawProps, ResolvedProps> {
  name: string;
  schema: z.ZodType<RawProps>;
  createDecoder(context: ComponentContext): ComponentDecoder<ResolvedProps>;
}
```

#### Subscription Lifecycle and Cleanup
A critical responsibility of the Decoder is tracking all subscriptions it creates (via `context.dataContext.subscribeDynamicValue`). 

When a component is removed from the UI (because its parent was replaced, the surface was deleted, etc.), the underlying framework must call the Decoder's `dispose()` method. The Decoder then iterates through its internally tracked subscription list and calls `unsubscribe()` on each one, ensuring that no dangling listeners remain attached to the global `DataModel`.

#### Generic Decoders via Zod (Web Implementation)
For TypeScript/Web implementations, we can write a generic `ZodDecoder` that automatically infers subscriptions. Instead of writing custom logic for every component, the decoder recursively inspects the Zod schema. 

When the `ZodDecoder` walks the schema and encounters known A2UI dynamic types (e.g., `DynamicStringSchema`), it automatically invokes `context.dataContext.subscribeDynamicValue()`. It stores the returned subscription objects in an internal array. When `dispose()` is called, it loops through this array and unsubscribes them all.

```typescript
// Conceptual Generic Zod Decoder Factory
export function createZodDecoder<T extends z.ZodTypeAny>(
  schema: T, 
  context: ComponentContext
): ComponentDecoder<z.infer<T>> {
  // 1. Walk the schema to find all DynamicValue and Action properties.
  // 2. Map `DynamicValue` properties to `context.dataContext.subscribeDynamicValue()` 
  //    and store the returned `DataSubscription` objects.
  // 3. Map `Action` properties to `context.dispatchAction()`.
  // 4. Combine all observables (e.g., using `combineLatest` in RxJS) into a single stream.
  // 5. Return an object conforming to ComponentDecoder whose `dispose()` method unsubscribes all stored subscriptions.
  
  return new GenericZodDecoder(schema, context);
}

// Button implementation becomes trivial:
export const ButtonFrontEnd: FrontEndLayer<ButtonRawProps, ButtonResolvedProps> = {
  name: "Button",
  schema: ButtonDef.schema,
  createDecoder: (ctx) => createZodDecoder(ButtonDef.schema, ctx)
};
```

*Note for Static Languages (Swift/Kotlin):* Dynamic runtime reflection isn't as easily feasible. Swift/Kotlin environments can rely on Code Generation (Swift Macros, KSP) to generate the boilerplate `Decoder` logic based on the schema at compile-time.

### 3. Framework-Specific Adapters
Framework developers should not interact with `ComponentContext` or `Decoder` directly when writing the actual UI view. We provide framework-specific adapters that bridge the `Decoder`'s stream to the framework's native reactivity and automatically handle the disposal lifecycle to guarantee memory safety.

**React Adapter (Highly Reactive):**
React supports subscribing to external stores directly. The adapter leverages `useSyncExternalStore` or `useEffect` to hook into the decoder's stream, and uses the `useEffect` cleanup return function to dispose of the decoder when the component unmounts.

```typescript
// react_adapter.ts
export function createReactComponent<Raw, Resolved>(
  frontEnd: FrontEndLayer<Raw, Resolved>,
  RenderComponent: React.FC<Resolved>
): ReactComponentRenderer {
  return {
    name: frontEnd.name,
    schema: frontEnd.schema,
    render: (ctx: ComponentContext) => {
      // Adapter maps `propsStream` into React state.
      // Crucially, it registers `decoder.dispose()` inside a `useEffect` cleanup block
      // so when React unmounts this component, the DataModel subscriptions are severed.
      return <ReactAdapterWrapper context={ctx} frontEnd={frontEnd} RenderComponent={RenderComponent} />;
    }
  };
}

// Usage:
const ReactButton = createReactComponent(ButtonFrontEnd, (props) => (
  <button onClick={props.action}>{props.label}</button> // `label` is purely a string here
));
```

**Angular Adapter (Class-Based, Less Reactive):**
Angular prefers explicit Input bindings and lifecycle hooks or `AsyncPipe`. The Angular adapter takes the decoder stream and manages `ChangeDetectorRef`. It hooks into the `ngOnDestroy` lifecycle event to guarantee disposal.

```typescript
// angular_adapter.ts
export function createAngularComponent<Raw, Resolved>(
  frontEnd: FrontEndLayer<Raw, Resolved>,
  ComponentClass: Type<any> // The Angular Component Class
): AngularComponentRenderer {
  return {
    name: frontEnd.name,
    schema: frontEnd.schema,
    render: (ctx: ComponentContext, viewContainerRef: ViewContainerRef) => {
      // 1. Instantiates the Angular Component via ViewContainerRef.
      // 2. Creates the decoder: `const decoder = frontEnd.createDecoder(ctx);`
      // 3. Subscribes to `decoder.propsStream` and explicitly updates component instance inputs.
      // 4. Calls `changeDetectorRef.detectChanges()`.
      // 5. Explicitly registers `decoder.dispose()` to fire when the ViewContainerRef is destroyed 
      //    (or via an ngOnDestroy hook on the wrapper), cleaning up the DataModel bindings.
      return new AngularAdapterWrapper(ctx, frontEnd, ComponentClass, viewContainerRef);
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

const NgButton = createAngularComponent(ButtonFrontEnd, AngularButtonComponent);
```

### 4. Strongly-Typed Catalog Implementations
To solve the problem of ensuring all components are properly implemented *and* match the exact API signature, we use TypeScript intersection types. This ensures that a provided renderer not only exists, but its `name` and `schema` strictly match the official Catalog Definition.

```typescript
// basic_catalog_api/implementation.ts

// Define the base constraint for any framework renderer
export interface BaseRenderer {
  name: string;
  schema: z.ZodTypeAny;
}

// The implementation map forces the framework renderer to intersect with the exact definition
export type BasicCatalogImplementation<TRenderer extends BaseRenderer> = {
  Button: TRenderer & { name: "Button", schema: typeof ButtonDef.schema };
  Text: TRenderer & { name: "Text", schema: typeof TextDef.schema };
  Row: TRenderer & { name: "Row", schema: typeof RowDef.schema };
  Column: TRenderer & { name: "Column", schema: typeof ColumnDef.schema };
  // ... all basic components
};

// Angular implementation Example
interface AngularComponentRenderer extends BaseRenderer {
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

To provide a super streamlined, `json-render`-style API for TypeScript users, we can build abstraction helpers on top of the Decoder architecture. This avoids the boilerplate of defining schemas, decoders, and implementations across multiple files.

### Conceptual Streamlined API (TypeScript Web Core)

Using the generic `ZodDecoder` capability, we can construct the API directly mapping to standard A2UI types (`ChildListSchema`, `ComponentIdSchema`).

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
The `defineCatalogImplementation` function automatically generates the generic `Decoder` under the hood based on the Zod schema provided in step 1, resolving dynamic values into static values passed directly to the render function.

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

1.  **Introduce the Decoder Layer Concept**: Detail that frameworks should not manually subscribe to `DataModel` paths. Instead, they should utilize a shared `ComponentDecoder` layer that outputs a framework-agnostic reactive stream of resolved properties.
2.  **Define Framework Adapters**: Add guidance on creating framework-specific adapters (e.g., React and Angular) that handle the lifecycle of the Decoder (subscription and disposal) and map its stream to native framework reactivity paradigms.
3.  **Strict Catalog Typing Strategy**: Recommend that Catalog implementations expose a generic `CatalogImplementation<T>` mapping interface so compiler errors enforce that implementations strictly match the required schema and naming signatures.
4.  **Mention Advanced DX Utilities**: Outline how TypeScript implementations can leverage schema-reflection via Zod to auto-generate Decoders (`createZodDecoder`), while static languages can rely on code-generation for streamlined development.