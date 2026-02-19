import { SurfaceModel, ActionListener } from './surface-model.js';
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
  private surfaceUnsubscribers: Map<string, () => void> = new Map();
  private lifecycleListeners: Set<SurfaceLifecycleListener<T>> = new Set();
  private actionListeners: Set<ActionListener> = new Set();

  constructor() {}

  addSurface(surface: SurfaceModel<T>): void {
    if (this.surfaces.has(surface.id)) {
      console.warn(`Surface ${surface.id} already exists. Ignoring.`);
      return;
    }

    this.surfaces.set(surface.id, surface);
    
    // Subscribe to surface actions and propagate
    const unsubscribe = surface.addActionListener((action) => this.dispatchAction(action));
    this.surfaceUnsubscribers.set(surface.id, unsubscribe);

    this.notifyCreated(surface);
  }

  deleteSurface(id: string): void {
    if (this.surfaces.has(id)) {
      // Unsubscribe from actions
      const unsubscribe = this.surfaceUnsubscribers.get(id);
      if (unsubscribe) {
        unsubscribe();
        this.surfaceUnsubscribers.delete(id);
      }

      this.surfaces.delete(id);
      this.notifyDeleted(id);
    }
  }

  getSurface(id: string): SurfaceModel<T> | undefined {
    return this.surfaces.get(id);
  }

  addLifecycleListener(listener: SurfaceLifecycleListener<T>): () => void {
    this.lifecycleListeners.add(listener);
    return () => this.lifecycleListeners.delete(listener);
  }

  removeLifecycleListener(listener: SurfaceLifecycleListener<T>): void {
    this.lifecycleListeners.delete(listener);
  }

  addActionListener(listener: ActionListener): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  removeActionListener(listener: ActionListener): void {
    this.actionListeners.delete(listener);
  }

  private async dispatchAction(action: any): Promise<void> {
    for (const listener of this.actionListeners) {
      try {
        await listener(action);
      } catch (e) {
        console.error('Error in SurfaceGroupModel ActionListener:', e);
      }
    }
  }

  private notifyCreated(surface: SurfaceModel<T>): void {
    for (const listener of this.lifecycleListeners) {
      try {
        listener.onSurfaceCreated?.(surface);
      } catch (e) {
        console.error('Error in onSurfaceCreated listener:', e);
      }
    }
  }

  private notifyDeleted(id: string): void {
    for (const listener of this.lifecycleListeners) {
      try {
        listener.onSurfaceDeleted?.(id);
      } catch (e) {
        console.error('Error in onSurfaceDeleted listener:', e);
      }
    }
  }
}
