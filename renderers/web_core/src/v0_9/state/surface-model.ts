
import { DataModel } from './data-model.js';
import { CatalogApi } from '../catalog/types.js';
import { ComponentsModel } from './components-model.js';
import { ComponentModel } from './component-model.js';

export type ActionHandler = (action: any) => Promise<void>;

/**
 * The state model for a single surface.
 * @template T The concrete type of the Catalog, which extends CatalogApi. 
 *             This allows the surface to hold a reference to a framework-specific 
 *             catalog (e.g., one that includes render functions) while maintaining 
 *             a generic interface for the core.
 */
export class SurfaceModel<T extends CatalogApi> {
  readonly dataModel: DataModel;
  readonly componentsModel: ComponentsModel;

  constructor(
    readonly id: string,
    readonly catalog: T,
    readonly theme: any = {},
    private readonly actionHandler: ActionHandler
  ) {
    this.dataModel = new DataModel({});
    this.componentsModel = new ComponentsModel();
  }

  dispatchAction(action: any): Promise<void> {
    return this.actionHandler(action);
  }
}
