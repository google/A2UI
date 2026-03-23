import { ComponentContext } from '@a2ui/web_core/v0_9';
import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { BoundProperty } from './types.js';
/**
 * Creates a reactive binding for a single A2UI component.
 *
 * This is the Svelte 5 equivalent of Angular's ComponentBinder service.
 * It creates the ComponentContext ONCE and maintains stable signal subscriptions
 * for the component's lifetime. Cleanup happens automatically via `$effect` teardown.
 *
 * MUST be called within a Svelte component's `<script>` block (needs rune context).
 *
 * @param surface The SurfaceModel this component belongs to.
 * @param componentId The unique ID of the component.
 * @param dataContextPath The data context scope path (default '/').
 * @returns A reactive record of bound properties, stable across re-renders.
 */
export declare function createComponentBinding(surface: SurfaceModel<ComponentApi>, componentId: string, dataContextPath?: string): {
    props: Record<string, BoundProperty>;
    context: ComponentContext;
};
/**
 * Resolves an action and dispatches it on the surface.
 *
 * This is the component-facing version — takes the surface + component metadata
 * that every component receives via props. The dispatch is async but fire-and-forget
 * since click handlers should not block on server acknowledgment.
 *
 * @param surface The SurfaceModel to dispatch on.
 * @param action The raw action value from bound props (props.action?.raw).
 * @param componentId The source component ID.
 * @param dataContextPath The current data context path.
 */
export declare function dispatchAction(surface: SurfaceModel<ComponentApi>, action: any, componentId: string, dataContextPath?: string): void;
/**
 * Normalizes a data model path for repeating template children.
 *
 * Used by layout components (Row, Column, List) when rendering children
 * from a data-bound template (ChildList with componentId + path).
 *
 * @param path The relative or absolute path from the template definition.
 * @param dataContextPath The current base data context path.
 * @param index The index of the child in the repeating list.
 * @returns A fully normalized absolute path for the indexed child.
 */
export declare function getNormalizedPath(path: string, dataContextPath: string, index: number): string;
//# sourceMappingURL=use-component.svelte.d.ts.map