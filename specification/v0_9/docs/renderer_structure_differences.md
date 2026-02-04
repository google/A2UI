# Renderer Structure Differences: v0.8 vs v0.9

This document outlines the architectural and structural differences between the existing v0.8 A2UI web renderers and the proposed v0.9 design.

## 1. Codebase Structure & Responsibilities

### v0.8 (Current)
*   **Core (`@a2ui/web_core`)**: Primarily contains **Types** (`AnyComponentNode` union), **Guards** (runtime validation), and a basic `MessageProcessor` that manages a data map. Logic for parsing specific component properties (like resolving a `DynamicString`) is often scattered or repeated in the renderers.
*   **Renderers (`@a2ui/lit`, `@a2ui/angular`)**:
    *   Hold the bulk of the logic.
    *   Have a `DynamicComponent` base class that handles some common tasks (like dispatching events).
    *   Components are strictly typed to the `AnyComponentNode` structure defined in Core.

### v0.9 (Proposed)
*   **Core (`@a2ui/web_core`)**: Becomes the "Brain".
    *   **State Management**: Includes a robust `DataModel` (observable store) and `SurfaceState`.
    *   **Base Logic**: Includes abstract base classes (`ButtonBase`, `TextBase`) for the Standard Catalog. These classes handle property parsing, validation, and interaction logic, leaving only the "painting" to the framework renderers.
*   **Renderers**: Become thinner "View" layers.
    *   Implement `ComponentContext` to bridge Core logic to the framework's change detection (Signals in Lit, ChangeDetector in Angular).
    *   Provide concrete implementations of the Standard Catalog components that inherit from Core bases.

## 2. Component Implementation & "Node" Intermediate Representation

### v0.8: The "Node" IR
In v0.8, the rendering process is two-step:
1.  **Decode**: The raw JSON message is validated and cast into a strict TypeScript union type: `AnyComponentNode`. This structure (the "Node" tree) mirrors the JSON schema exactly.
2.  **Render**: The renderer walks this `AnyComponentNode` tree. Components receive a `node` input (e.g., `TextNode`, `ButtonNode`).

**Drawback**: Adding a new component requires updating the `AnyComponentNode` union type in Core, or bypassing type safety.

### v0.9: Direct JSON Rendering
In v0.9, the "Node" intermediate representation is removed.
1.  **Raw Access**: Components accept a `ComponentContext`. This context provides access to the **raw JSON properties**.
2.  **Logic-Driven**: The Component implementation (specifically the Base class) decides what properties to look for. It effectively defines the schema requirements through code.

**Benefit**: The Core framework doesn't need to know about every possible component type. It just orchestrates the generic `Catalog` interface.

## 3. Custom Components & Catalog Management

### v0.8: Global Registry
*   **Mechanism**: Uses a singleton `componentRegistry` or framework-specific maps (like `DEFAULT_CATALOG` in Angular).
*   **Implementation**: Users register a custom web component or Angular component against a string key.
*   **Limitation**: Hard to have different sets of components for different surfaces or contexts without complex configuration.

### v0.9: Catalog Instances
*   **Mechanism**: Introduces the `Catalog` interface. A Catalog is simply an object that maps a component name to a `Component` implementation.
*   **Implementation**: Custom components are just another Catalog.
*   **Scoped**: A `Surface` is initialized with a specific `Catalog`. Different surfaces can use entirely different sets of components easily.

## 4. Extending the Standard Catalog

### v0.8
To add a component, you typically register it into the global registry. To *modify* a standard component, you might have to monkey-patch the registry or provide a custom map that overrides the default key.

### v0.9
To add or modify components, you create a **New Catalog** derived from the Standard Catalog. Since Catalogs are just objects/classes, this is standard composition.

**Example: Adding a "Map" component**

```typescript
import { createLitStandardCatalog } from '@a2ui/lit';
import { MapComponent } from './my-map-component';

// 1. Create the base standard catalog
const standardCatalog = createLitStandardCatalog();

// 2. Create a new components map by cloning the standard one
const components = new Map(standardCatalog.components);

// 3. Add the custom Map component
// Assuming MapComponent handles properties: title, latitude, longitude
components.set('Map', new MapComponent());

// 4. Create a new catalog that extends it
const myAppCatalog: Catalog<TemplateResult> = {
  id: 'https://myapp.com/catalog',
  components, // Use the new map
  
  getComponent(name: string) {
    return this.components.get(name);
  }
};

// 5. Register this catalog with the Processor
processor.registerCatalog(myAppCatalog);
```

## 5. Data Binding & State

### v0.8
*   **Data**: Managed largely as a flat map in `MessageProcessor`.
*   **Binding**: Components manually call `resolvePrimitive(value)`.
*   **Reactivity**: In Lit, `SignalWatcher` is used, but the connection between the data path and the component update is somewhat implicit.

### v0.9
*   **Data**: Managed by `SurfaceState` -> `DataModel`.
*   **Binding**: Components call `context.resolve(value)`.
*   **Reactivity**: The `ComponentContext` implementation in the renderer is responsible for setting up the reactivity. For example, in Lit, `context.resolve` will automatically subscribe the current rendering context to the specific data path in the `Model`, ensuring precise, fine-grained updates.

## 6. Surface Component API

The entry point for developers using the library has been simplified.

### v0.8
Developers had to pass multiple coordinated properties to the `<a2ui-surface>` component:
```html
<a2ui-surface 
  surfaceId="main" 
  .processor=${processor}
></a2ui-surface>
```
The Surface component was responsible for reaching into the global processor and finding its own data.

### v0.9
The Surface component now takes a single, self-contained state object:
```html
<a2ui-surface 
  .state=${processor.getSurfaceState('main')}
></a2ui-surface>
```
**Why this is better:**
*   **Isolation**: The Surface component doesn't need to know about the global `A2uiMessageProcessor`. It only cares about the state of its specific surface.
*   **Testability**: You can easily test a Surface by passing a mock `SurfaceState` without instantiating the entire message processing infrastructure.
*   **Encapsulation**: Catalog negotiation and Data Model scoping are handled *before* the state reaches the renderer.

## Summary Table

| Feature | v0.8 | v0.9 |
| :--- | :--- | :--- |
| **Parsing** | JSON -> `AnyComponentNode` (Typed) | JSON -> Raw Properties (Untyped) |
| **Component Logic** | Duplicated in Renderers | Centralized in Core Base Classes |
| **Registry** | Singleton / Static Map | `Catalog` Interface (Instance based) |
| **Extensibility** | Register globally | Compose/Wrap Catalog objects |
| **State Scope** | Global (mostly) | Scoped to `SurfaceState` |
