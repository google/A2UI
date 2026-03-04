import { DataModel } from './data-model.js';
import { Catalog, ComponentApi } from '../catalog/types.js';
import { SurfaceComponentsModel } from './surface-components-model.js';
import { EventEmitter, EventSource } from '../common/events.js';

export type ActionListener = (action: any) => void | Promise<void>;

/**
 * The state model for a single surface.
 * @template T The concrete type of the ComponentApi.
 */
export class SurfaceModel<T extends ComponentApi> {
  readonly dataModel: DataModel;
  readonly componentsModel: SurfaceComponentsModel;

  private readonly _onAction = new EventEmitter<any>();

  /** Fires whenever an action is dispatched from this surface. */
  readonly onAction: EventSource<any> = this._onAction;

  /**
   * Creates a new surface model.
   *
   * @param id The unique identifier for this surface.
   * @param catalog The component catalog used by this surface.
   * @param theme The theme to apply to this surface.
   */
  constructor(
    readonly id: string,
    readonly catalog: Catalog<T>,
    readonly theme: any = {}
  ) {
    this.dataModel = new DataModel({});
    this.componentsModel = new SurfaceComponentsModel();
  }

  /**
   * Dispatches an action from this surface to listeners.
   *
   * @param action The action object to dispatch.
   */
  async dispatchAction(action: any): Promise<void> {
    await this._onAction.emit(action);
  }

  /**
   * Disposes of the surface and its resources.
   */
  dispose(): void {
    this.dataModel.dispose();
    this.componentsModel.dispose();
    this._onAction.dispose();
  }
}
