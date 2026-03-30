import {
  ComponentContext,
  DataContext,
  effect,
  type Signal as PreactSignal,
} from '@a2ui/web_core/v0_9';
import type { SurfaceModel, ComponentApi } from '@a2ui/web_core/v0_9';
import type { BoundProperty } from './types.js';
import { disposeSignal } from './signal-bridge.svelte.js';

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
export function createComponentBinding(
  surface: SurfaceModel<ComponentApi>,
  componentId: string,
  dataContextPath: string = '/',
): { props: Record<string, BoundProperty>; context: ComponentContext } {
  const context = new ComponentContext(surface, componentId, dataContextPath);
  const rawProps = context.componentModel.properties;
  const bound: Record<string, BoundProperty> = {};
  const signals: PreactSignal<any>[] = [];
  const disposers: (() => void)[] = [];

  for (const key of Object.keys(rawProps)) {
    const rawValue = rawProps[key];
    const preactSignal: PreactSignal<any> = context.dataContext.resolveSignal(rawValue);
    signals.push(preactSignal);

    // Create Svelte $state for each prop — this is the reactive bridge
    let current = $state<any>(preactSignal.peek());

    // Subscribe to Preact signal changes
    const dispose = effect(() => {
      current = preactSignal.value;
    });
    disposers.push(dispose);

    const isBoundPath = rawValue && typeof rawValue === 'object' && 'path' in rawValue;

    bound[key] = {
      get value() {
        return current;
      },
      raw: rawValue,
      onUpdate: isBoundPath
        ? (newValue: any) => context.dataContext.set(rawValue.path, newValue)
        : () => {},
    };
  }

  // Register cleanup to run when the host component is destroyed
  $effect(() => {
    return () => {
      for (const dispose of disposers) dispose();
      for (const sig of signals) disposeSignal(sig);
    };
  });

  return { props: bound, context };
}

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
export function dispatchAction(
  surface: SurfaceModel<ComponentApi>,
  action: any,
  componentId: string,
  dataContextPath: string = '/',
): void {
  if (!action) return;
  const dataContext = new DataContext(surface, dataContextPath);
  const resolved = dataContext.resolveAction(action);
  surface.dispatchAction(resolved, componentId).catch((err) => {
    console.error('[a2ui/svelte] Action dispatch failed:', err);
    surface.dispatchError({
      code: 'ACTION_DISPATCH_ERROR',
      message: err?.message ?? 'Action dispatch failed',
    }).catch(() => {});
  });
}

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
export function getNormalizedPath(path: string, dataContextPath: string, index: number): string {
  let normalized = path || '';
  if (!normalized.startsWith('/')) {
    const base = dataContextPath === '/' ? '' : dataContextPath;
    normalized = `${base}/${normalized}`;
  }
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return `${normalized}/${index}`;
}
