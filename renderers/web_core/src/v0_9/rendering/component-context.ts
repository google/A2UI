import { DataContext } from './data-context.js';
import { ComponentModel } from '../state/component-model.js';
import type { SurfaceModel } from '../state/surface-model.js';
import type { ComponentApi } from '../catalog/types.js';
import type { SurfaceComponentsModel } from '../state/surface-components-model.js';

/**
 * Context provided to components during rendering.
 * It provides access to the component's model, the data context, and a way to dispatch actions.
 */
export class ComponentContext {
  readonly componentModel: ComponentModel;
  readonly dataContext: DataContext;
  readonly surfaceComponents: SurfaceComponentsModel;

  /**
   * Creates a new component context.
   *
   * @param surface The surface model the component belongs to.
   * @param componentId The ID of the component.
   * @param dataModelBasePath The base path for data model access (default: '/').
   */
  constructor(
    surface: SurfaceModel<any>,
    componentId: string,
    dataModelBasePath: string = '/'
  ) {
    const model = surface.componentsModel.get(componentId);
    if (!model) {
      throw new Error(`Component not found: ${componentId}`);
    }
    this.componentModel = model;
    this.surfaceComponents = surface.componentsModel;
    this.dataContext = new DataContext(surface.dataModel, dataModelBasePath);
    this._actionDispatcher = (action) => surface.dispatchAction(action);
  }

  private _actionDispatcher: (action: any) => Promise<void>;

  /**
   * Dispatches an action from the component.
   *
   * @param action The action to dispatch.
   */
  dispatchAction(action: any): Promise<void> {
    return this._actionDispatcher(action);
  }
}
