/**
 * A2UI Surface Hooks
 * React hooks for consuming MessageProcessor state
 */

import { useSyncExternalStore, useCallback, useMemo } from 'react';
import { MessageProcessor, getDefaultProcessor } from '../processor';
import type { SurfaceState, StoredComponent } from '../processor/types';

/**
 * Hook to subscribe to all surface IDs
 */
export function useSurfaceIds(processor?: MessageProcessor): string[] {
  const proc = processor || getDefaultProcessor();

  const subscribe = useCallback(
    (callback: () => void) => {
      return proc.subscribe(() => callback());
    },
    [proc]
  );

  const getSnapshot = useCallback(() => {
    return proc.getSurfaceIds();
  }, [proc]);

  // We need to track version for the snapshot to update
  const version = useSyncExternalStore(
    subscribe,
    () => proc.getVersion(),
    () => proc.getVersion()
  );

  // Memoize based on version to avoid unnecessary array recreation
  return useMemo(() => proc.getSurfaceIds(), [proc, version]);
}

/**
 * Hook to get a specific surface's state
 */
export function useSurface(surfaceId: string, processor?: MessageProcessor): SurfaceState | undefined {
  const proc = processor || getDefaultProcessor();

  const subscribe = useCallback(
    (callback: () => void) => {
      return proc.subscribe((id) => {
        if (id === surfaceId || id === '*') {
          callback();
        }
      });
    },
    [proc, surfaceId]
  );

  const getSnapshot = useCallback(() => {
    return proc.getSurface(surfaceId);
  }, [proc, surfaceId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook to get a component from a surface
 */
export function useComponent(
  surfaceId: string,
  componentId: string,
  processor?: MessageProcessor
): StoredComponent | undefined {
  const surface = useSurface(surfaceId, processor);
  return surface?.components.get(componentId);
}

/**
 * Hook to get the data model for a surface
 */
export function useDataModel(
  surfaceId: string,
  processor?: MessageProcessor
): Map<string, unknown> {
  const surface = useSurface(surfaceId, processor);
  return surface?.dataModel || new Map();
}

/**
 * Hook to get a specific value from the data model
 */
export function useDataValue<T = unknown>(
  surfaceId: string,
  path: string,
  processor?: MessageProcessor
): T | undefined {
  const dataModel = useDataModel(surfaceId, processor);
  return dataModel.get(path) as T | undefined;
}

/**
 * Hook to get the root component ID for a surface
 */
export function useRootId(surfaceId: string, processor?: MessageProcessor): string | null {
  const surface = useSurface(surfaceId, processor);
  return surface?.rootId ?? null;
}

/**
 * Hook to check if a surface is ready to render
 */
export function useSurfaceReady(surfaceId: string, processor?: MessageProcessor): boolean {
  const surface = useSurface(surfaceId, processor);
  return surface?.status === 'ready';
}
