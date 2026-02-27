import { EventEmitter, EventSource } from '../common/events.js';

export class ComponentModel {
  private _properties: Record<string, any>;
  private readonly _onUpdated = new EventEmitter<ComponentModel>();
  
  /** 
   * Fires whenever the component's properties are updated.
   */
  readonly onUpdated: EventSource<ComponentModel> = this._onUpdated;

  constructor(
    readonly id: string,
    readonly type: string,
    initialProperties: Record<string, any>
  ) {
    this._properties = initialProperties;
  }

  get properties(): Record<string, any> {
    return this._properties;
  }

  set properties(newProperties: Record<string, any>) {
    this._properties = newProperties;
    this._onUpdated.emit(this);
  }

  dispose(): void {
    this._onUpdated.dispose();
  }
}
