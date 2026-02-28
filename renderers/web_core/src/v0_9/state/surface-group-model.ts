import { SurfaceModel } from './surface-model.js';
import { ComponentApi } from '../catalog/types.js';
import { EventEmitter, EventSource, Subscription } from '../common/events.js';

/**
 * The root state model for the A2UI system.
 * Manages the collection of active surfaces.
 */
export class SurfaceGroupModel<T extends ComponentApi> {
  private surfaces: Map<string, SurfaceModel<T>> = new Map();
  private surfaceUnsubscribers: Map<string, Subscription> = new Map();
  
  private readonly _onSurfaceCreated = new EventEmitter<SurfaceModel<T>>();
  private readonly _onSurfaceDeleted = new EventEmitter<string>();
  private readonly _onAction = new EventEmitter<any>();

  /** Fires when a new surface is added. */
  readonly onSurfaceCreated: EventSource<SurfaceModel<T>> = this._onSurfaceCreated;
  /** Fires when a surface is removed. */
  readonly onSurfaceDeleted: EventSource<string> = this._onSurfaceDeleted;
  /** Fires when an action is dispatched from ANY surface in the group. */
  readonly onAction: EventSource<any> = this._onAction;

  addSurface(surface: SurfaceModel<T>): void {
    if (this.surfaces.has(surface.id)) {
      console.warn(`Surface ${surface.id} already exists. Ignoring.`);
      return;
    }

    this.surfaces.set(surface.id, surface);

    // Subscribe to surface actions and propagate
    const sub = surface.onAction.subscribe((action) => this._onAction.emit(action));
    this.surfaceUnsubscribers.set(surface.id, sub);

    this._onSurfaceCreated.emit(surface);
  }

  deleteSurface(id: string): void {
    const surface = this.surfaces.get(id);
    if (surface) {
      const sub = this.surfaceUnsubscribers.get(id);
      if (sub) {
        sub.unsubscribe();
        this.surfaceUnsubscribers.delete(id);
      }

      this.surfaces.delete(id);
      surface.dispose();
      this._onSurfaceDeleted.emit(id);
    }
  }

  getSurface(id: string): SurfaceModel<T> | undefined {
    return this.surfaces.get(id);
  }

  dispose(): void {
    for (const id of Array.from(this.surfaces.keys())) {
      this.deleteSurface(id);
    }
    this._onSurfaceCreated.dispose();
    this._onSurfaceDeleted.dispose();
    this._onAction.dispose();
  }
}
