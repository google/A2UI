import type { Component as SvelteComponent } from 'svelte';
import type { ComponentApi } from '@a2ui/web_core/v0_9';
/**
 * A component property bound to a reactive Svelte value with an update callback.
 *
 * Components receive a `Record<string, BoundProperty>` as their `props` prop.
 * Use `prop.value` to read the current value (reactive via Svelte 5 runes).
 * Call `prop.onUpdate(newValue)` for two-way binding (e.g., text field input).
 */
export interface BoundProperty<T = any> {
    /** The current resolved value. Reactive — will trigger re-renders when changed. */
    readonly value: T;
    /** The raw value from the A2UI component model (may be a literal or a data binding). */
    readonly raw: any;
    /** Callback to push a new value back to the A2UI data model. No-op for non-bound values. */
    readonly onUpdate: (newValue: T) => void;
}
/**
 * Standard props interface for all A2UI Svelte components.
 *
 * Every component in the registry receives these props from ComponentHost.
 */
export interface A2UIComponentProps {
    props: Record<string, BoundProperty>;
    surface: import('@a2ui/web_core/v0_9').SurfaceModel<ComponentApi>;
    componentId: string;
    dataContextPath: string;
    registry: ComponentRegistry;
    /** The theme object from the surface, if any. */
    theme: any;
}
/**
 * A registry mapping component type names to Svelte components.
 * Users can override any entry to swap in their own design system components.
 */
export type ComponentRegistry = Map<string, SvelteComponent<any>>;
/**
 * Preact Signal with optional unsubscribe for computed signals.
 * This type exposes the `.unsubscribe()` method that web_core attaches
 * to signals returned by `DataContext.resolveSignal()` for computed values.
 */
export interface DisposableSignal<T> {
    readonly value: T;
    peek(): T;
    unsubscribe?: () => void;
}
//# sourceMappingURL=types.d.ts.map