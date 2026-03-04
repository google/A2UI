import { ComponentModel } from "./component-model.js";
import { EventEmitter, EventSource } from "../common/events.js";

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

  /**
   * Retrieves a component by its ID.
   *
   * @param id The ID of the component to retrieve.
   */
  get(id: string): ComponentModel | undefined {
    return this.components.get(id);
  }

  /**
   * Returns an iterator over the components in the model.
   */
  get entries(): IterableIterator<[string, ComponentModel]> {
    return this.components.entries();
  }

  /**
   * Adds a component to the model.
   * Throws an error if a component with the same ID already exists.
   *
   * @param component The component to add.
   */
  addComponent(component: ComponentModel): void {
    if (this.components.has(component.id)) {
      throw new Error(`Component with id '${component.id}' already exists.`);
    }

    this.components.set(component.id, component);
    this._onCreated.emit(component);
  }

  /**
   * Removes a component from the model by its ID.
   * Disposes of the component upon removal.
   *
   * @param id The ID of the component to remove.
   */
  removeComponent(id: string): void {
    const component = this.components.get(id);
    if (component) {
      this.components.delete(id);
      component.dispose();
      this._onDeleted.emit(id);
    }
  }

  /**
   * Disposes of the model and all its components.
   */
  dispose(): void {
    for (const component of this.components.values()) {
      component.dispose();
    }
    this.components.clear();
    this._onCreated.dispose();
    this._onDeleted.dispose();
  }
}
