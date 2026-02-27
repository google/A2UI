import { ComponentModel } from './component-model.js';
import { EventEmitter, EventSource } from '../common/events.js';

/**
 * Manages the collection of components for a specific surface.
 */
export class SurfaceComponentsModel {
  private components: Map<string, ComponentModel> = new Map();
  
  private readonly _onCreated = new EventEmitter<ComponentModel>();
  private readonly _onDeleted = new EventEmitter<string>();

  /** Fires when a new component is added to the model. */
  readonly onCreated: EventSource<ComponentModel> = this._onCreated;
  /** Fires when a component is removed, providing the ID of the deleted component. */
  readonly onDeleted: EventSource<string> = this._onDeleted;

  get(id: string): ComponentModel | undefined {
    return this.components.get(id);
  }

  addComponent(component: ComponentModel): void {
    if (this.components.has(component.id)) {
      throw new Error(`Component with id '${component.id}' already exists.`);
    }

    this.components.set(component.id, component);
    this._onCreated.emit(component);
  }

  removeComponent(id: string): void {
    const component = this.components.get(id);
    if (component) {
      this.components.delete(id);
      component.dispose();
      this._onDeleted.emit(id);
    }
  }

  dispose(): void {
    for (const component of this.components.values()) {
      component.dispose();
    }
    this.components.clear();
    this._onCreated.dispose();
    this._onDeleted.dispose();
  }
}
