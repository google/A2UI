# Web Renderer v0.9 Design Document

**Status:** Draft
**Target Version:** v0.9
**Related Spec:** [A2UI Protocol v0.9](./a2ui_protocol.md)

## Overview

This document outlines the design for the v0.9 implementation of the A2UI Web Renderers (Lit and Angular).

**Primary Goals:**
1.  **Centralize Logic:** Move as much logic as possible (state management, data binding resolution, message processing) into the shared `@a2ui/web_core` library.
2.  **Decouple Catalog:** The core renderer framework must not depend on the "Standard Catalog". It should be capable of rendering any catalog provided to it.
3.  **One-Step Rendering:** Transformation from JSON data to rendered output should happen in a single pass within the framework-specific renderer, rather than decoding to an intermediate node tree.

## Architecture

The architecture consists of a shared core library and framework-specific renderers.

### Core (`@a2ui/web_core`)
The core library acts as the brain. It holds the state of the UI (Data Model) and the logic for processing the A2UI protocol stream. It defines the interfaces for `Catalog` and `Component` but does not implement specific UI widgets.

### Framework Renderers (`@a2ui/lit`, `@a2ui/angular`)
These libraries provide the implementation for the `Surface` and the concrete `Component` definitions (e.g., how to render a "Button" in Lit vs Angular). They use the Core library to drive the application state.

## API Design

### 1. Catalog & Component

The rendering system is driven by a `Catalog`, which is a collection of `Component` definitions.

#### `Component<T>`
A generic interface representing a UI component definition. `T` is the renderer-specific output (e.g., `TemplateResult` for Lit, or a component class/template for Angular).

```typescript
// in web_core
export interface Component<T> {
  readonly name: string;

  /**
   * Renders the component given the current context.
   */
  render(context: ComponentContext<T>): T;
}
```

#### `ComponentContext<T>`
Passed to the `render` method, providing access to data and utilities.

```typescript
// in web_core
export interface ComponentContext<T> {
  /**
   * The raw JSON properties for this component instance.
   */
  readonly properties: Record<string, unknown>;

  /**
   * Resolves a dynamic value (DynamicString, DynamicBoolean, etc.)
   * to a concrete value, handling subscriptions to the data model.
   */
  resolve<V>(value: DynamicValue<V>): V;

  /**
   * Resolves a child list (explicit or template) into rendered output.
   */
  renderChildren(children: ChildList): T[];

  /**
   * Dispatch an action to the server or client function.
   */
  dispatchAction(action: Action): void;
  
  /**
   * The ID of the surface being rendered.
   */
  readonly surfaceId: string;
}
```

#### `Catalog<T>`
A registry of components.

```typescript
// in web_core
export class Catalog<T> {
  constructor(readonly components: Map<string, Component<T>>) {}

  getComponent(name: string): Component<T> | undefined {
    return this.components.get(name);
  }
  
  // APIs for extending catalogs
  extend(other: Catalog<T>): Catalog<T>;
}
```

### 2. Message Processing & State

#### `A2uiMessageProcessor`
The main entry point in `web_core`. It manages the state of multiple surfaces.

```typescript
// in web_core
export class A2uiMessageProcessor {
  private readonly surfaces = new Map<string, SurfaceState>();
  
  constructor(
    private readonly catalogResolver: (catalogId: string) => Catalog<any>
  ) {}

  process(message: ServerToClientMessage): void {
    // Dispatch to handleCreateSurface, handleUpdateComponents, etc.
  }

  getSurfaceState(surfaceId: string): SurfaceState | undefined;
}
```

#### `SurfaceState` (Internal to Core)
Holds the state for a single surface:
-   `dataModel`: The JSON data model.
-   `componentDefinitions`: Map of ID -> Component Instance Data (raw JSON).
-   `rootId`: ID of the root component.

### 3. Standard Catalog Base Implementation

To reduce duplication between Lit and Angular, the `web_core` will provide abstract base classes for Standard Catalog components. These classes handle property parsing and validation.

```typescript
// in web_core/standard_catalog/base
export abstract class BaseCardComponent<T> implements Component<T> {
  readonly name = "Card";

  render(context: ComponentContext<T>): T {
    const props = context.properties as CardProperties; // Typed raw props
    
    // Resolve children logic (template vs explicit) is handled by context helper
    // but specific logic for Card can go here.
    
    const childId = props.child;
    // ... validation logic ...

    return this.renderResolved(context, childId);
  }

  /**
   * Framework-specific implementation to actually draw the card.
   */
  abstract renderResolved(context: ComponentContext<T>, childId: string): T;
}
```

## Detailed File Structure

### `@a2ui/web_core`

```
src/
  v0_9/
    index.ts (Exports public API)
    types/
      schema.ts (Generated from JSON schema)
      common.ts
    data/
      data_model.ts
      path_resolution.ts
    processing/
      message_processor.ts
      surface_state.ts
    catalog/
      component.ts (Interfaces)
      catalog.ts
      context.ts
    standard_catalog/ (Base implementations)
      index.ts
      card_base.ts
      text_base.ts
      ...
```

### `@a2ui/lit`

```
src/
  v0_9/
    index.ts
    surface.ts (The <a2ui-surface> custom element)
    lit_context.ts (Implements ComponentContext)
    catalog/
      lit_catalog.ts (The default catalog instance)
    components/ (Concrete implementations)
      card.ts
      text.ts
      ...
```

### `@a2ui/angular`

```
src/
  lib/
    v0_9/
      index.ts
      surface.component.ts
      angular_context.ts
      catalog/
        angular_catalog.ts
      components/
        card.component.ts
        text.component.ts
        ...
```

## Testing Plan

### 1. Core Logic (Unit Tests)
-   **Data Model**: Test path resolution, relative/absolute paths, collection scopes.
-   **Message Processor**: Test message dispatching, surface creation/deletion, error handling.
-   **Catalog Base**: Test that base components correctly parse properties and call `renderResolved`.

### 2. Renderer Integration (Component Tests)
-   **Lit**: Use `@open-wc/testing` to render individual components (e.g., `Text`) with a mock `ComponentContext` and assert on the DOM output.
-   **Angular**: Use Angular TestBed to render components with a mock context.

### 3. End-to-End
-   Use the `samples/` to run full integration tests where a mock agent sends a stream of v0.9 messages and we verify the final rendered DOM.

## Implementation Phasing

1.  **Phase 1: Core Data & Processing**
    *   Implement `DataModel` (path resolution, updates).
    *   Implement `A2uiMessageProcessor` skeleton (handling `createSurface`, `updateDataModel`).
    *   *Deliverable*: Core tests passing for data updates.

2.  **Phase 2: Catalog & Component Interfaces**
    *   Define `Component`, `ComponentContext`, `Catalog` interfaces in Core.
    *   Implement `SurfaceState` to hold component definitions (raw JSON).
    *   Implement `updateComponents` handling in Processor.

3.  **Phase 3: Standard Catalog Base**
    *   Create `BaseComponent` classes for `Text`, `Column`, `Row` in Core.
    *   Implement logic to parse arguments and resolve bindings in the base class.

4.  **Phase 4: Lit Renderer Skeleton**
    *   Implement `LitComponentContext`.
    *   Implement `LitSurface`.
    *   Implement `Text` and `Column` for Lit.
    *   *Deliverable*: Hello World (render a Column with Text).

5.  **Phase 5: Angular Renderer Skeleton**
    *   Implement Angular equivalents of Phase 4.

6.  **Phase 6: Full Standard Catalog**
    *   Flesh out remaining components (`Button`, `Input`, `List` templates) in Core Base and Renderers.

## Open Questions

1.  **Context Construction**: Should the `Surface` create the `ComponentContext`, or should the `MessageProcessor` create it?
    *   *Proposed*: `Surface` creates it, as it holds the framework-specific rendering mechanisms (e.g., `ChangeDetectorRef` in Angular).
2.  **Template Resolution**: How exactly does `ChildList` (templates) work with `ComponentContext`?
    *   *Proposed*: `context.renderChildren(list)` returns an array of `T`. The Core logic handles iterating the data model and creating new Contexts with the correct scoping for each item.
3.  **Output Format**: What is `T` for Angular?
    *   *Proposed*: Likely `Type<any>` or a specific interface wrapper that allows dynamic component creation (e.g., `ViewContainerRef.createComponent`).

## References

*   **v0.9 Spec**: `@specification/v0_9/docs/a2ui_protocol.md`
*   **Existing Lit Renderer**: `@renderers/lit/src/0.8/`
*   **Existing Angular Renderer**: `@renderers/angular/src/lib/`
*   **Flutter Catalog Implementation**: [Flutter GenUI Catalog](https://raw.githubusercontent.com/flutter/genui/refs/heads/main/packages/genui/lib/src/model/catalog.dart)
