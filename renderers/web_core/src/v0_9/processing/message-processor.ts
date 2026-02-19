
import { SurfaceModel, ActionListener } from '../state/surface-model.js';
import { CatalogApi } from '../catalog/types.js';
import { SurfaceGroupModel, SurfaceLifecycleListener } from '../state/surface-group-model.js';
import { ComponentModel } from '../state/component-model.js';

export type { SurfaceLifecycleListener };

/**
 * The central processor for A2UI messages.
 * @template T The concrete type of the Catalog, which extends CatalogApi.
 */
export class A2uiMessageProcessor<T extends CatalogApi> {
  readonly model: SurfaceGroupModel<T> = new SurfaceGroupModel<T>();

  /**
   * @param catalogs A list of available catalogs.
   * @param actionHandler A global handler for actions from all surfaces.
   */
  constructor(
    private catalogs: T[],
    private actionHandler: ActionListener
  ) {
    this.model.addActionListener(this.actionHandler);
  }

  /**
   * Adds a listener for surface lifecycle events.
   * @returns A function to unsubscribe the listener.
   */
  addLifecycleListener(listener: SurfaceLifecycleListener<T>): () => void {
    return this.model.addLifecycleListener(listener);
  }

  /**
   * Removes a lifecycle listener.
   */
  removeLifecycleListener(listener: SurfaceLifecycleListener<T>): void {
    this.model.removeLifecycleListener(listener);
  }

  processMessages(messages: any[]): void {
    for (const msg of messages) {
      if (msg.createSurface) {
        this.handleCreateSurface(msg.createSurface);
      } else if (msg.blockInput) {
        // TODO: Handle blockInput
      } else if (msg.updateComponents || msg.updateDataModel || msg.deleteSurface) {
        this.routeMessage(msg);
      }
    }
  }

  getSurfaceModel(surfaceId: string): SurfaceModel<T> | undefined {
    return this.model.getSurface(surfaceId);
  }

  private handleCreateSurface(payload: any) {
    const { surfaceId, catalogId, theme } = payload;

    // Find catalog
    const catalog = this.catalogs.find(c => c.id === catalogId);
    if (!catalog) {
      console.warn(`Catalog not found: ${catalogId}`);
      // Using first catalog as fallback or erroring? 
      // For now, let's create a surface with no catalog or throw?
      // Better to ignore or error.
      return;
    }

    if (this.model.getSurface(surfaceId)) {
        console.warn(`Surface ${surfaceId} already exists. Ignoring.`);
        return;
    }

    const surface = new SurfaceModel<T>(surfaceId, catalog, theme);
    this.model.addSurface(surface);
  }

  private routeMessage(msg: any) {
    // Extract surfaceId from payload
    const payload = msg.updateComponents || msg.updateDataModel || msg.deleteSurface;
    if (!payload?.surfaceId) return;

    if (msg.deleteSurface) {
      this.model.deleteSurface(payload.surfaceId);
      return;
    }

    const surface = this.model.getSurface(payload.surfaceId);
    if (surface) {
      if (msg.updateComponents) {
        const payload = msg.updateComponents;
        for (const comp of payload.components) {
          const { id, component, ...properties } = comp;
          
          const existing = surface.componentsModel.get(id);
          if (existing) {
            if (component && component !== existing.type) {
                console.warn(`Attempting to change type of component ${id} from ${existing.type} to ${component}. Ignoring new type.`);
            }
            existing.update(properties);
          } else {
            if (!component) {
                console.warn(`Cannot create component ${id} without a type.`);
                continue;
            }
            const newComponent = new ComponentModel(id, component, properties);
            surface.componentsModel.addComponent(newComponent);
          }
        }
      } else if (msg.updateDataModel) {
        const payload = msg.updateDataModel;
        const path = payload.path || '/';
        const value = payload.value;
        surface.dataModel.set(path, value);
      }
    } else {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
    }
  }
}
