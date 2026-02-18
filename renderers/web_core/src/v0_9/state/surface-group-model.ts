import { SurfaceModel, ActionHandler } from './surface-model.js';
import { CatalogApi } from '../catalog/types.js';

export interface SurfaceLifecycleListener<T extends CatalogApi> {
  onSurfaceCreated?: (surface: SurfaceModel<T>) => void;
  onSurfaceDeleted?: (surfaceId: string) => void;
}

/**
 * The root state model for the A2UI system.
 * Manages the collection of active surfaces.
 */
export class SurfaceGroupModel<T extends CatalogApi> {
  private surfaces: Map<string, SurfaceModel<T>> = new Map();
  private listeners: Set<SurfaceLifecycleListener<T>> = new Set();

  constructor() {}

  createSurface(
    id: string,
    catalog: T,
    theme: any,
    actionHandler: ActionHandler
  ): SurfaceModel<T> {
    if (this.surfaces.has(id)) {
      console.warn(`Surface ${id} already exists. Returning existing surface.`);
      return this.surfaces.get(id)!;
    }

    const surface = new SurfaceModel<T>(id, catalog, theme, actionHandler);
    this.surfaces.set(id, surface);
    this.notifyCreated(surface);
    return surface;
  }

  deleteSurface(id: string): void {
    if (this.surfaces.has(id)) {
      this.surfaces.delete(id);
      this.notifyDeleted(id);
    }
  }

  getSurface(id: string): SurfaceModel<T> | undefined {
    return this.surfaces.get(id);
  }

  addLifecycleListener(listener: SurfaceLifecycleListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  removeLifecycleListener(listener: SurfaceLifecycleListener<T>): void {
    this.listeners.delete(listener);
  }

  private notifyCreated(surface: SurfaceModel<T>): void {
    for (const listener of this.listeners) {
      try {
        listener.onSurfaceCreated?.(surface);
      } catch (e) {
        console.error('Error in onSurfaceCreated listener:', e);
      }
    }
  }

  private notifyDeleted(id: string): void {
    for (const listener of this.listeners) {
      try {
        listener.onSurfaceDeleted?.(id);
      } catch (e) {
        console.error('Error in onSurfaceDeleted listener:', e);
      }
    }
  }
}
