import { EventEmitter, EventSource } from '../common/events.js';

export class ComponentModel {
  private _properties: Record<string, any>;
  private readonly _onUpdated = new EventEmitter<ComponentModel>();

  /**
   * Fires whenever the component's properties are updated.
   */
  readonly onUpdated: EventSource<ComponentModel> = this._onUpdated;

  /**
   * Creates a new component model.
   *
   * @param id The unique identifier for this component.
   * @param type The component type name.
   * @param initialProperties The initial properties for the component.
   */
  constructor(
    readonly id: string,
    readonly type: string,
    initialProperties: Record<string, any>,
  ) {
    this._properties = initialProperties;
  }

  /**
   * The current properties of the component.
   */
  get properties(): Record<string, any> {
    return this._properties;
  }

  set properties(newProperties: Record<string, any>) {
    this._properties = newProperties;
    this._onUpdated.emit(this);
  }

  /**
   * Disposes of the component and its resources.
   */
  dispose(): void {
    this._onUpdated.dispose();
  }

  /**
   * Returns a JSON representation of the component tree.
   */
  get componentTree(): any {
    return {
      id: this.id,
      type: this.type,
      ...this._properties,
    };
  }
}
