import { useMemo, useRef, useEffect } from 'react';
import {
  ComponentContext,
  DataContext,
  effect,
  type Signal as PreactSignal,
  type SurfaceModel,
  type ComponentApi,
} from '@a2ui/web_core/v0_9';
import { useSyncExternalStore } from 'react';
import type { BoundProperty } from './types.js';

/**
 * Hook that binds all properties of an A2UI component to React-reactive values.
 *
 * @param surface The SurfaceModel this component belongs to.
 * @param componentId The unique ID of the component.
 * @param dataContextPath The data context scope path.
 * @returns A record of bound properties with reactive values.
 */
export function useComponentProps(
  surface: SurfaceModel<ComponentApi>,
  componentId: string,
  dataContextPath: string = '/',
): Record<string, BoundProperty> {
  const contextRef = useRef<ComponentContext>(null!);
  if (!contextRef.current) {
    contextRef.current = new ComponentContext(surface, componentId, dataContextPath);
  }

  const context = contextRef.current;
  const rawProps = context.componentModel.properties;

  const bound = useMemo(() => {
    const result: Record<string, BoundProperty> = {};

    for (const key of Object.keys(rawProps)) {
      const rawValue = rawProps[key];
      const preactSignal: PreactSignal<any> = context.dataContext.resolveSignal(rawValue);
      const isBoundPath = rawValue && typeof rawValue === 'object' && 'path' in rawValue;

      result[key] = {
        get value() {
          return preactSignal.peek();
        },
        raw: rawValue,
        onUpdate: isBoundPath
          ? (newValue: any) => context.dataContext.set(rawValue.path, newValue)
          : () => {},
      };
    }

    return result;
  }, [componentId, dataContextPath]);

  // Force re-render when any signal changes
  const version = useSignalVersion(rawProps, context);

  return bound;
}

/**
 * Internal hook: subscribes to all signals and returns a version counter
 * that increments on any change, forcing React re-render.
 */
function useSignalVersion(
  rawProps: Record<string, any>,
  context: ComponentContext,
): number {
  return useSyncExternalStore(
    (onStoreChange) => {
      const disposers: (() => void)[] = [];

      for (const key of Object.keys(rawProps)) {
        const preactSignal = context.dataContext.resolveSignal(rawProps[key]);
        const dispose = effect(() => {
          preactSignal.value;
          onStoreChange();
        });
        disposers.push(() => {
          dispose();
          if ((preactSignal as any).unsubscribe) {
            (preactSignal as any).unsubscribe();
          }
        });
      }

      return () => disposers.forEach((d) => d());
    },
    () => Date.now(), // snapshot changes on every update
    () => Date.now(),
  );
}

/**
 * Dispatches an A2UI action from a component.
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
  surface.dispatchAction(resolved, componentId);
}

/**
 * Normalizes a data model path for repeating template children.
 */
export function getNormalizedPath(path: string, dataContextPath: string, index: number): string {
  let normalized = path || '';
  if (!normalized.startsWith('/')) {
    const base = dataContextPath === '/' ? '' : dataContextPath;
    normalized = `${base}/${normalized}`;
  }
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  return `${normalized}/${index}`;
}
