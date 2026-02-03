# Web Renderer v0.9 Design Document

**Status:** Draft
**Target Version:** 0.9
**Authors:** Gemini Agent

## Overview

This document outlines the design for the v0.9 Web Renderers (Lit and Angular) for A2UI. The primary goals of this iteration are:

1.  **Centralized Logic:** Move as much state management, data processing, and validation logic as possible into the shared `@a2ui/web_core` library.
2.  **Decoupling:** Decouple the core rendering framework from the `standard_catalog`. The framework should be a generic engine capable of rendering *any* catalog provided to it.
3.  **One-Step Rendering:** Move from a two-step "decode to node -> render node" process to a direct "JSON -> Rendered Output" process within the framework-specific components, utilizing a generic `Catalog` interface.
4.  **Version Coexistence:** Implement v0.9 side-by-side with v0.8 in a `/0.9` directory structure, ensuring no breaking changes for existing v0.8 consumers.

## Architecture

The architecture consists of a shared core library handling state and protocol messages, and framework-specific renderers (Lit, Angular).

The core introduces a `SurfaceState` object which encapsulates the state for a single surface, including its `DataModel` and the current snapshot of component definitions. The `A2uiMessageProcessor` manages these `SurfaceState` objects.

### Key Class Interactions

```mermaid
classDiagram
    class A2uiMessageProcessor {
        +processMessages(messages)
        +getSurfaceState(surfaceId)
        -surfaces: Map<String, SurfaceState>
        -catalogRegistry: Map<String, Catalog>
    }

    class SurfaceState {
        +id: String
        +dataModel: DataModel
        +catalog: Catalog
        +handleMessage(message)
        +dispatchAction(action)
    }

    class DataModel {
        +get(path)
        +set(path, value)
        +subscribe(path, callback)
    }

    class SurfaceRenderer {
        +state: SurfaceState
        +render()
    }

    class Catalog {
        +getComponent(name)
    }

    class Component~T~ {
        +render(context: ComponentContext): T
    }

    class ComponentContext {
        +surfaceState: SurfaceState
        +resolveDynamicValue(val)
        +buildChild(id)
        +dispatchEvent(event)
    }

    A2uiMessageProcessor *-- SurfaceState
    SurfaceState *-- DataModel
    SurfaceState --> Catalog
    SurfaceRenderer --> SurfaceState : Input
    SurfaceRenderer ..> Component : Instantiates via State.Catalog
    Component ..> ComponentContext : Uses
```

## API Design

### 1. DataModel (Core)

A standalone, observable data store representing the client-side state. It handles JSON Pointer path resolution and subscription management.

```typescript
// web_core/src/v0_9/state/data-model.ts

export type DataSubscriber = (value: any) => void;
export type Unsubscribe = () => void;

export class DataModel {
  /**
   * Updates the model at the specific path.
   * If path is '/', replaces the entire root.
   */
  set(path: string, value: any): void;

  /**
   * Retrieves data at a specific path.
   * Returns undefined if path does not exist.
   */
  get(path: string): any;

  /**
   * Subscribes to changes at a specific path.
   * The callback is invoked whenever the value at 'path' (or its ancestors/descendants) changes.
   */
  subscribe(path: string, callback: DataSubscriber): Unsubscribe;
}
```

### 2. SurfaceState (Core)

Holds the complete state for a single surface. This acts as the brain for a specific surface, processing messages and exposing state to the renderer.

```typescript
// web_core/src/v0_9/state/surface-state.ts

export type ActionHandler = (action: UserAction) => Promise<void>;

export class SurfaceState {
  readonly id: string;
  readonly dataModel: DataModel;
  readonly catalog: Catalog<any>;
  readonly theme: any;
  
  constructor(
    id: string, 
    catalog: Catalog<any>, 
    theme: any,
    actionHandler: ActionHandler
  );

  /**
   * The ID of the root component for this surface.
   */
  get rootComponentId(): string | null;

  /**
   * Retrieves the raw component definition (JSON) for a given ID.
   */
  getComponentDefinition(componentId: string): ComponentInstance | undefined;

  /**
   * Processes a single A2UI message targeted at this surface.
   * Updates DataModel or Component definitions accordingly.
   */
  handleMessage(message: ServerToClientMessage): void;

  /**
   * Dispatches a user action to the registered handler.
   */
  dispatchAction(action: UserAction): Promise<void>;
}
```

### 3. Catalog & Component (Core Interface)

The definition of what a Component is, generic over the output type `T` (e.g., `TemplateResult` for Lit).

```typescript
// web_core/src/v0_9/catalog/types.ts

/**
 * A definition of a UI component.
 * @template T The type of the rendered output (e.g. TemplateResult).
 */
export interface Component<T> {
  /** The name of the component as it appears in the A2UI JSON (e.g., 'Button'). */
  name: string;

  /**
   * Renders the component given the context.
   */
  render(context: ComponentContext<T>): T;
}

export interface Catalog<T> {
  id: string;
  
  /** 
   * A map of available components. 
   * This is readonly to encourage immutable extension patterns.
   */
  readonly components: ReadonlyMap<string, Component<T>>;

  /**
   * Retrieves a component definition by name.
   * This can be a convenience wrapper around the map or handle fallback logic.
   */
  getComponent(name: string): Component<T> | undefined;

  // Note: Functions will also be defined here in future iterations
  // readonly functions: ReadonlyMap<string, FunctionDefinition>;
}
```

### 4. ComponentContext (Core Interface)

The bridge passed to every component's render method. It provides access to the raw properties, the ability to resolve dynamic values, and the ability to render children.

```typescript
// web_core/src/v0_9/rendering/component-context.ts

export interface ComponentContext<T> {
  /**
   * The unique ID of this component instance.
   */
  readonly id: string;

  /**
   * The raw JSON properties for this component (excluding 'id' and 'component').
   */
  readonly properties: Record<string, any>;

  /**
   * The surface state this component belongs to.
   */
  readonly surfaceState: SurfaceState;

  /**
   * Resolves a dynamic value (literal, path, or function call).
   * This handles creating subscriptions to the DataModel automatically if used within
   * a reactive context (implementation specific).
   */
  resolve<V>(value: DynamicValue<V> | V): V;

  /**
   * Renders a child component by its ID.
   * Returns null if the child does not exist.
   */
  renderChild(childId: string): T | null;

  /**
   * Dispatches a user action back to the system (and server).
   */
  dispatchAction(action: Action): Promise<void>;
}
```

### 5. A2uiMessageProcessor (Core)

The central entry point. It manages the lifecycle of `SurfaceState` objects, routing incoming messages to the correct surface and multiplexing outgoing events.

```typescript
// web_core/src/v0_9/processing/message-processor.ts

export class A2uiMessageProcessor {
  /**
   * @param catalogs A map of available catalogs keyed by their URI.
   * @param actionHandler A global handler for actions from all surfaces.
   */
  constructor(
    private catalogs: Map<string, Catalog<any>>,
    private actionHandler: ActionHandler
  );

  /**
   * Processes a list of server-to-client messages.
   * For `createSurface`, it instantiates a new `SurfaceState` with the correct Catalog.
   * For other messages, it delegates to the appropriate `SurfaceState.handleMessage`.
   */
  processMessages(messages: ServerToClientMessage[]): void;

  /**
   * Gets the SurfaceState for a specific surface ID.
   */
  getSurfaceState(surfaceId: string): SurfaceState | undefined;
}
```

### 5. Base Classes for Standard Catalog (Core)

To reduce code duplication between Lit and Angular, we define abstract base classes for standard components in Core.

```typescript
// web_core/src/v0_9/standard_catalog/base/card-base.ts

import { Component, ComponentContext } from '../../catalog/types';

export abstract class CardBaseComponent<T> implements Component<T> {
  readonly name = 'Card';

  render(context: ComponentContext<T>): T {
    const childId = context.properties['child'];
    // Logic to validate childId could go here
    return this.renderConcrete(context, childId);
  }

  /**
   * Framework-specific implementation.
   */
  protected abstract renderConcrete(
    context: ComponentContext<T>, 
    childId: string
  ): T;
}
```

### 6. SurfaceRenderer (Framework Specific)

The `SurfaceRenderer` (typically exported as `Surface`) is the top-level component that users place in their applications. It serves as the gateway between the framework's DOM and the A2UI state.

```typescript
// Interface for the component's inputs
export interface SurfaceProps {
  /**
   * The complete state for this surface, obtained from A2uiMessageProcessor.
   */
  state: SurfaceState;
}
```

**Responsibilities:**
1.  **Reactivity**: It observes the `SurfaceState`. When the `rootComponentId` changes, or when component definitions are updated, it triggers a re-render.
2.  **Theming**: It reads `SurfaceState.theme` and applies it to the surface container, typically by generating CSS Custom Properties (variables) like `--a2ui-primary-color`.
3.  **Root Orchestration**: It identifies the component definition for 'root', instantiates the framework-specific `ComponentContext`, and calls the root component's `render()` method.
4.  **Error Boundaries**: It provides a top-level catch for rendering errors within the surface.

## Detailed File Structure

### Web Core (`@a2ui/web_core`)

```text
src/
  v0_9/
    index.ts                  # Public API exports
    types/
      messages.ts             # TS interfaces for JSON schemas
      common.ts
    state/
      data-model.ts           # DataModel implementation
      data-model.test.ts
      surface-state.ts        # SurfaceState implementation
    processing/
      message-processor.ts    # A2uiMessageProcessor
      message-processor.test.ts
    catalog/
      types.ts                # Component, Catalog, ComponentContext interfaces
      catalog-registry.ts     # Helper to manage multiple catalogs
    standard_catalog/
      base/                   # Abstract base classes
        text-base.ts
        card-base.ts
        button-base.ts
        ...
      functions/              # Standard function implementations (pure JS/TS)
        logic.ts
        formatting.ts
```

### Lit Renderer (`@a2ui/lit`)

```text
src/
  v0_9/
    index.ts                  # Public exports
    renderer/
      lit-component-context.ts # Implementation of ComponentContext<TemplateResult>
      lit-renderer.ts          # Orchestrates rendering a Surface
    standard_catalog/
      index.ts                 # Exports the catalog definition
      components/              # Concrete implementations of standard components
        text.ts                 # Concrete implementation extending TextBaseComponent
        card.ts
        ...
    ui/
      surface.ts              # <a2ui-surface> custom element
```

### Angular Renderer (`@a2ui/angular`)

```text
src/
  lib/
    v0_9/
      index.ts
      renderer/
        angular-component-context.ts
        renderer.service.ts
      standard_catalog/
        index.ts               # Exports the catalog definition
        components/            # Concrete Angular components for standard catalog
          text.component.ts
          card.component.ts
          ...
      ui/
        surface.component.ts
```

## Component Implementation Detail

This section illustrates how specific components are implemented using the base class pattern to share logic while delegating rendering to the specific framework.

### Example 1: Button (Action Handling)

**1. Core Base Class**
Location: `@a2ui/web_core/src/v0_9/standard_catalog/base/button-base.ts`

The base class handles property extraction and normalization. It prepares the data needed for the concrete renderer.

```typescript
import { Component, ComponentContext } from '../../catalog/types';

export interface ButtonRenderProps {
  childId: string;
  variant: 'primary' | 'borderless' | 'default';
  disabled: boolean;
  onAction: () => void;
}

export abstract class ButtonBase<T> implements Component<T> {
  readonly name = 'Button';

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    
    // 1. Extract Properties
    const childId = properties['child'] as string;
    const variant = (properties['variant'] as string) || 'default';
    
    // 2. Resolve Dynamic Values
    // Check 'checks' logic to determine if disabled
    const disabled = context.resolve<boolean>(properties['enabled'] ?? true) === false; 

    // 3. Prepare Action Handler
    const action = properties['action'];
    const onAction = () => {
      if (!disabled && action) {
        context.dispatchAction(action);
      }
    };

    // 4. Delegate to Concrete Implementation
    return this.renderConcrete(context, {
      childId,
      variant: variant as any,
      disabled,
      onAction
    });
  }

  protected abstract renderConcrete(
    context: ComponentContext<T>, 
    props: ButtonRenderProps
  ): T;
}
```

**2. Lit Implementation**
Location: `@a2ui/lit/src/v0_9/standard_catalog/components/button.ts`

```typescript
import { html, TemplateResult } from 'lit';
import { ButtonBase, ButtonRenderProps } from '@a2ui/web_core/.../button-base';
import { ComponentContext } from '../../renderer/lit-component-context';

export class LitButton extends ButtonBase<TemplateResult> {
  protected renderConcrete(
    context: ComponentContext, 
    props: ButtonRenderProps
  ): TemplateResult {
    // recursively render the child
    const childContent = context.renderChild(props.childId);

    return html`
      <button 
        class="variant-${props.variant}" 
        ?disabled=${props.disabled}
        @click=${props.onAction}
      >
        ${childContent}
      </button>
    `;
  }
}
```

**3. Angular Implementation**
Location: `@a2ui/angular/src/lib/v0_9/standard_catalog/components/button.ts`

For Angular, `T` is a `RenderableDefinition`. The actual Angular `@Component` that renders the pixels can be defined in a separate file or **inline in the same file** for cohesion.

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonBase, ButtonRenderProps } from '@a2ui/web_core/.../button-base';

// 1. The Framework Component (Visuals)
// Defined inline for simplicity and locality.
@Component({
  selector: 'a2ui-std-button',
  template: `
    <button 
      [class]="'variant-' + variant" 
      [disabled]="disabled" 
      (click)="action.emit()">
        <!-- *a2uiOutlet is a directive that knows how to render RenderableDefinitions -->
        <ng-container *a2uiOutlet="child"></ng-container>
    </button>
  `,
  styles: [`...`]
})
export class ButtonComponent {
  @Input() variant: string = 'default';
  @Input() disabled: boolean = false;
  @Input() child: any; // RenderableDefinition
  @Output() action = new EventEmitter<void>();
}

// 2. The A2UI Adapter (Logic)
export class AngularButton extends ButtonBase<RenderableDefinition> {
  protected renderConcrete(
    context: ComponentContext, 
    props: ButtonRenderProps
  ): RenderableDefinition {
    // Return the definition. The Surface component acts as the "renderer" 
    // that interprets this and creates the ButtonComponent.
    return {
      componentType: ButtonComponent,
      inputs: {
        variant: props.variant,
        disabled: props.disabled,
        // context.renderChild returns a RenderableDefinition for the child
        child: context.renderChild(props.childId) 
      },
      outputs: {
        action: props.onAction
      }
    };
  }
}
```

### Example 2: Slider (Two-Way Binding)

**1. Core Base Class**
Location: `@a2ui/web_core/src/v0_9/standard_catalog/base/slider-base.ts`

The base class handles resolving the value from the Data Model and providing a callback to update it.

```typescript
import { Component, ComponentContext } from '../../catalog/types';

export interface SliderRenderProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (newValue: number) => void;
}

export abstract class SliderBase<T> implements Component<T> {
  readonly name = 'Slider';

  render(context: ComponentContext<T>): T {
    const { properties } = context;

    // 1. Resolve Dynamic Values (creates subscriptions in the context)
    const value = context.resolve<number>(properties['value'] ?? 0);
    const min = context.resolve<number>(properties['min'] ?? 0);
    const max = context.resolve<number>(properties['max'] ?? 100);
    const label = context.resolve<string>(properties['label'] ?? '');

    // 2. Prepare Change Handler
    const onChange = (newValue: number) => {
      // Helper method on context to write back to the path defined in the property
      context.updateBoundValue(properties['value'], newValue);
    };

    return this.renderConcrete(context, {
      value,
      min,
      max,
      label,
      onChange
    });
  }

  protected abstract renderConcrete(
    context: ComponentContext<T>, 
    props: SliderRenderProps
  ): T;
}
```

**2. Lit Implementation**
Location: `@a2ui/lit/src/v0_9/standard_catalog/components/slider.ts`

```typescript
import { html, TemplateResult } from 'lit';
import { SliderBase, SliderRenderProps } from '@a2ui/web_core/.../slider-base';

export class LitSlider extends SliderBase<TemplateResult> {
  protected renderConcrete(
    context: ComponentContext, 
    props: SliderRenderProps
  ): TemplateResult {
    return html`
      <div class="slider-container">
        <label>${props.label}</label>
        <input 
          type="range"
          .value=${props.value}
          .min=${props.min}
          .max=${props.max}
          @input=${(e: Event) => props.onChange((e.target as HTMLInputElement).valueAsNumber)}
        />
        <span>${props.value}</span>
      </div>
    `;
  }
}
```

**3. Angular Implementation**
Location: `@a2ui/angular/src/lib/v0_9/standard_catalog/components/slider.ts`

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SliderBase, SliderRenderProps } from '@a2ui/web_core/.../slider-base';

// 1. The Framework Component
@Component({
  selector: 'a2ui-std-slider',
  template: `
    <div class="slider-container">
      <label>{{ label }}</label>
      <input 
        type="range" 
        [value]="value" 
        [min]="min" 
        [max]="max" 
        (input)="onInput($event)"
      />
      <span>{{ value }}</span>
    </div>
  `
})
export class SliderComponent {
  @Input() value: number = 0;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() label: string = '';
  @Output() valueChange = new EventEmitter<number>();

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).valueAsNumber;
    this.valueChange.emit(val);
  }
}

// 2. The A2UI Adapter
export class AngularSlider extends SliderBase<RenderableDefinition> {
  protected renderConcrete(
    context: ComponentContext, 
    props: SliderRenderProps
  ): RenderableDefinition {
    return {
      componentType: SliderComponent,
      inputs: {
        value: props.value,
        min: props.min,
        max: props.max,
        label: props.label
      },
      outputs: {
        valueChange: props.onChange
      }
    };
  }
}
```

### Binding to A2UI (Catalog Registration)

Each framework's `standard_catalog/index.ts` will export a factory function that instantiates the Catalog with the concrete components.

```typescript
// @a2ui/lit/src/v0_9/standard_catalog/index.ts

import { Catalog } from '@a2ui/web_core/v0_9/catalog/types';
import { LitButton } from './components/button';
import { LitSlider } from './components/slider';
// ... other components

export function createLitStandardCatalog(): Catalog<TemplateResult> {
  const components = new Map<string, Component<TemplateResult>>();
  
  components.set('Button', new LitButton());
  components.set('Slider', new LitSlider());
  // ...

  return {
    id: 'https://a2ui.org/specification/v0_9/standard_catalog.json',
    getComponent(name: string) {
      return components.get(name);
    }
  };
}
```

## Renderer Output Formats & Resolution

### Lit
*   **Output Format (`T`):** `TemplateResult` (from `lit-html`).
*   **Dynamic Resolution:** `LitComponentContext.resolve()` uses `@lit-labs/signals` or a similar mechanism to create a signal that updates when the underlying `DataModel` path changes. The `render` method of the component will effectively be a computed signal.

### Angular
*   **Output Format (`T`):** This is trickier in Angular. The "Render" function for an Angular component in this design is actually a factory or a configuration that the `Surface` component uses to dynamically spawn `NgComponentOutlet` or `ViewContainerRef`.
    *   *Proposed:* `T` is an object: `{ type: Type<any>, inputs: Record<string, any> }`.
    *   The `AngularStandardCatalog` returns a mapping to actual Angular Components (`@Component`).
    *   The `render` function in the `Component` interface calculates the inputs based on the context.

## Testing Plan

1.  **Core DataModel**:
    *   Test `set`/`get` with simple values, objects, and arrays.
    *   Test `subscribe` triggers correctly for direct updates, parent updates, and child updates.
2.  **Core MessageProcessor**:
    *   Test processing `createSurface`, `updateComponents`, `updateDataModel`.
    *   Verify internal state matches the message sequence.
3.  **Core Standard Catalog Bases**:
    *   Unit test property parsing and validation logic independent of rendering.
4.  **Framework Renderers**:
    *   **Isolation**: Test individual components (e.g., Lit `Text` component) by passing a mock `ComponentContext`. Verify the output HTML/Template.
    *   **Integration**: Test `Surface` component with a real `A2uiMessageProcessor` and a mock Catalog. Feed it JSON messages and verify the DOM structure.

## Implementation Phasing

1.  **Phase 1: Core Foundation**
    *   Implement `DataModel` with tests.
    *   Implement `A2uiMessageProcessor` (skeleton handling messages) with tests.
    *   Define `Component`, `Catalog`, `ComponentContext` interfaces.

2.  **Phase 2: Standard Catalog Base**
    *   Implement `StandardCatalog` base classes in Core for 2-3 components (e.g., `Text`, `Column`, `Button`).
    *   Implement standard functions logic (string interpolation etc).

3.  **Phase 3: Lit Prototype**
    *   Implement `LitComponentContext`.
    *   Implement `LitStandardCatalog` in the `standard_catalog` directory for the initial 2-3 components.
    *   Implement `<a2ui-surface>` that connects the Processor to the rendering logic.

4.  **Phase 4: Angular Prototype**
    *   Implement `AngularComponentContext`.
    *   Implement `AngularStandardCatalog` in the `standard_catalog` directory and corresponding Angular Components.
    *   Implement `<a2ui-surface>` for Angular.

5.  **Phase 5: Full Standard Catalog**
    *   Flesh out the rest of the components (Inputs, Lists, etc.) in Core and both renderers.

## Open Questions & Answers

*   **Q: Should the surface and a2uimessageprocessor both accept the catalogs?**
    *   **A:** No. `A2uiMessageProcessor` accepts the registry of Catalogs. When `createSurface` is processed, the Processor creates a `SurfaceState` and injects the specific `Catalog` required for that surface. The `Surface` component then accepts the `SurfaceState` as input, giving it access to everything it needs (DataModel, Catalog, Event Dispatcher).
    *   *Decision:* `A2uiMessageProcessor` holds the registry. `SurfaceState` holds the specific instance. `Surface` (Renderer) takes `SurfaceState`.

*   **Q: API for resolving DynamicString?**
    *   **A:** `ComponentContext.resolve<T>(value: DynamicValue<T>): T`. This method encapsulates checking if it's a literal, a path (calling DataModel), or a function (executing logic).

*   **Q: DataModel API?**
    *   **A:** See "API Design > DataModel". It mimics a simplified deep-observable object store.

*   **Q: Renderer Output Format?**
    *   **A:** Lit: `TemplateResult`. Angular: `{ component: Type<any>, inputs: Record<string, any> }` (Representation of a dynamic component).

## Standard catalog implementation

There will be a standard catalog implementation, decoupled from the core renderer in a folder like standard_catalog which has an implementation of the standard catalog.

So in the framework-specific catalog renderers, the standard catalog implementation should be clearly separated from the rendering framework, in the same way as the web core codebase.

The standard catalog implementation for each framework will reside in a `standard_catalog` directory within the framework's package. This directory will export the catalog definition and contain the concrete implementations of the standard components.

## References

*   **v0.9 Spec:** `@specification/v0_9/**`
*   **Existing Lit Renderer:** `@renderers/lit/**`
*   **Flutter Catalog Implementation:** `genui` package (reference for catalog patterns).