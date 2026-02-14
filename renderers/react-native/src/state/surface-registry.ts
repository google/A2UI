/**
 * Surface Registry
 *
 * Manages multiple A2UI rendering surfaces. Each surface represents
 * an independent rendering context with its own component tree and data model.
 */

import type { A2UIComponent, Surface } from '../types/a2ui-types';

export interface SurfaceRegistryOptions {
  /** Called when a surface is created */
  onSurfaceCreated?: (surfaceId: string) => void;

  /** Called when a surface is deleted */
  onSurfaceDeleted?: (surfaceId: string) => void;

  /** Called when a surface is updated */
  onSurfaceUpdated?: (surfaceId: string) => void;

  /** Enable debug logging */
  debug?: boolean;
}

export interface SurfaceRegistry {
  /** Create or update a surface */
  createSurface: (surfaceId: string, rootId: string) => void;

  /** Get a surface by ID */
  getSurface: (surfaceId: string) => Surface | undefined;

  /** Check if a surface exists */
  hasSurface: (surfaceId: string) => boolean;

  /** Delete a surface */
  deleteSurface: (surfaceId: string) => boolean;

  /** Update components in a surface */
  updateComponents: (surfaceId: string, components: A2UIComponent[]) => void;

  /** Update a single value in the data model */
  updateDataModel: (surfaceId: string, path: string[], value: unknown) => void;

  /** Get all surface IDs */
  getSurfaceIds: () => string[];

  /** Clear all surfaces */
  clear: () => void;

  /** Subscribe to changes */
  subscribe: (listener: (surfaceId: string) => void) => () => void;
}

/**
 * Creates a surface registry for managing A2UI rendering surfaces
 *
 * @example
 * ```typescript
 * const registry = createSurfaceRegistry({
 *   onSurfaceUpdated: (id) => forceRender(),
 *   debug: true,
 * });
 *
 * registry.createSurface('main', 'root');
 * registry.updateComponents('main', components);
 * ```
 */
export function createSurfaceRegistry(options: SurfaceRegistryOptions = {}): SurfaceRegistry {
  const {
    onSurfaceCreated,
    onSurfaceDeleted,
    onSurfaceUpdated,
    debug = false,
  } = options;

  const surfaces = new Map<string, Surface>();
  const listeners = new Set<(surfaceId: string) => void>();

  function log(message: string, data?: unknown): void {
    if (debug) {
      console.log(`[A2UI SurfaceRegistry] ${message}`, data ?? '');
    }
  }

  function notifyListeners(surfaceId: string): void {
    listeners.forEach(listener => listener(surfaceId));
  }

  function createSurface(surfaceId: string, rootId: string): void {
    const existing = surfaces.get(surfaceId);

    if (existing) {
      // Update existing surface's rootId
      existing.rootId = rootId;
      log(`Updated surface root: ${surfaceId} -> ${rootId}`);
    } else {
      // Create new surface
      const surface: Surface = {
        id: surfaceId,
        rootId,
        components: new Map(),
        dataModel: {},
      };
      surfaces.set(surfaceId, surface);
      log(`Created surface: ${surfaceId}`);

      if (onSurfaceCreated) {
        onSurfaceCreated(surfaceId);
      }
    }

    notifyListeners(surfaceId);
  }

  function getSurface(surfaceId: string): Surface | undefined {
    return surfaces.get(surfaceId);
  }

  function hasSurface(surfaceId: string): boolean {
    return surfaces.has(surfaceId);
  }

  function deleteSurface(surfaceId: string): boolean {
    const deleted = surfaces.delete(surfaceId);

    if (deleted) {
      log(`Deleted surface: ${surfaceId}`);
      if (onSurfaceDeleted) {
        onSurfaceDeleted(surfaceId);
      }
      notifyListeners(surfaceId);
    }

    return deleted;
  }

  function updateComponents(surfaceId: string, components: A2UIComponent[]): void {
    const surface = surfaces.get(surfaceId);

    if (!surface) {
      log(`Surface not found for component update: ${surfaceId}`);
      return;
    }

    // Update component buffer
    for (const component of components) {
      surface.components.set(component.id, component);
    }

    log(`Updated ${components.length} components in surface: ${surfaceId}`);

    if (onSurfaceUpdated) {
      onSurfaceUpdated(surfaceId);
    }

    notifyListeners(surfaceId);
  }

  function updateDataModel(surfaceId: string, path: string[], value: unknown): void {
    const surface = surfaces.get(surfaceId);

    if (!surface) {
      log(`Surface not found for data model update: ${surfaceId}`);
      return;
    }

    // Navigate to the correct location and set the value
    if (path.length === 0) {
      // Replace entire data model
      surface.dataModel = value as Record<string, unknown>;
    } else {
      // Set nested value
      let current: Record<string, unknown> = surface.dataModel;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      current[path[path.length - 1]] = value;
    }

    log(`Updated data model path [${path.join('.')}] in surface: ${surfaceId}`);

    if (onSurfaceUpdated) {
      onSurfaceUpdated(surfaceId);
    }

    notifyListeners(surfaceId);
  }

  function getSurfaceIds(): string[] {
    return Array.from(surfaces.keys());
  }

  function clear(): void {
    const ids = getSurfaceIds();
    surfaces.clear();

    for (const id of ids) {
      if (onSurfaceDeleted) {
        onSurfaceDeleted(id);
      }
    }

    log('Cleared all surfaces');
  }

  function subscribe(listener: (surfaceId: string) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    createSurface,
    getSurface,
    hasSurface,
    deleteSurface,
    updateComponents,
    updateDataModel,
    getSurfaceIds,
    clear,
    subscribe,
  };
}

/**
 * Get a component by ID from a surface
 */
export function getComponentFromSurface(
  surface: Surface,
  componentId: string
): A2UIComponent | undefined {
  return surface.components.get(componentId);
}

/**
 * Get the root component of a surface
 */
export function getRootComponent(surface: Surface): A2UIComponent | undefined {
  return surface.components.get(surface.rootId);
}
