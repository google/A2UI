
import { DataModel } from './data-model.js';
import { CatalogApi } from '../catalog/types.js';
import { SurfaceComponentsModel } from './surface-components-model.js';
import { ComponentModel } from './component-model.js';
import { DataContext } from '../rendering/data-context.js';
import { ComponentContext } from '../rendering/component-context.js';

export type ActionListener = (action: any) => void | Promise<void>;

/**
 * The state model for a single surface.
 * @template T The concrete type of the Catalog, which extends CatalogApi. 
 *             This allows the surface to hold a reference to a framework-specific 
 *             catalog (e.g., one that includes render functions) while maintaining 
 *             a generic interface for the core.
 */
export class SurfaceModel<T extends CatalogApi> {
  readonly dataModel: DataModel;
  readonly componentsModel: SurfaceComponentsModel;
  private actionListeners: Set<ActionListener> = new Set();

  constructor(
    readonly id: string,
    readonly catalog: T,
    readonly theme: any = {}
  ) {
    this.dataModel = new DataModel({});
    this.componentsModel = new SurfaceComponentsModel();
  }

  /**
   * Adds a listener for actions dispatched from this surface.
   * @returns A function to unsubscribe the listener.
   */
  addActionListener(listener: ActionListener): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  /**
   * Removes an action listener.
   */
  removeActionListener(listener: ActionListener): void {
    this.actionListeners.delete(listener);
  }

  /**
   * Creates a ComponentContext for a given component ID and data model base path.
   * This context provides access to the component's model, scoped data, and action dispatching.
   */
  createComponentContext(componentId: string, dataModelBasePath: string = '/'): ComponentContext | undefined {
    const componentModel = this.componentsModel.get(componentId);
    if (!componentModel) return undefined;

    const dataContext = new DataContext(this.dataModel, dataModelBasePath);

    return new ComponentContext(componentModel, dataContext, (action) => this.dispatchAction(action));
  }

  async dispatchAction(action: any): Promise<void> {
    for (const listener of this.actionListeners) {
      try {
        await listener(action);
      } catch (e) {
        console.error('Error in ActionListener:', e);
      }
    }
  }
}
