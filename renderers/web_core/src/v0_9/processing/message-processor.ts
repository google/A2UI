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
      this.processMessage(msg);
    }
  }

  getSurfaceModel(surfaceId: string): SurfaceModel<T> | undefined {
    return this.model.getSurface(surfaceId);
  }

  private processMessage(msg: any): void {
    if (msg.createSurface) {
      const payload = msg.createSurface;
      const { surfaceId, catalogId, theme } = payload;

      // Find catalog
      const catalog = this.catalogs.find(c => c.id === catalogId);
      if (!catalog) {
        console.warn(`Catalog not found: ${catalogId}`);
        return;
      }

      if (this.model.getSurface(surfaceId)) {
        console.warn(`Surface ${surfaceId} already exists. Ignoring.`);
        return;
      }

      const surface = new SurfaceModel<T>(surfaceId, catalog, theme);
      this.model.addSurface(surface);
      return;
    }

    const updateTypes = ['updateComponents', 'updateDataModel', 'deleteSurface'].filter(k => msg[k]);
    if (updateTypes.length > 1) {
      console.warn(`Message contains multiple update types: ${updateTypes.join(', ')}. Ignoring.`);
      return;
    }

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
        const updatePayload = msg.updateComponents;
        for (const comp of updatePayload.components) {
          const { id, component, ...properties } = comp;

          const existing = surface.componentsModel.get(id);
          if (existing) {
            if (component && component !== existing.type) {
              // Recreate component if type changes
              surface.componentsModel.removeComponent(id);
              const newComponent = new ComponentModel(id, component, properties);
              surface.componentsModel.addComponent(newComponent);
            } else {
              existing.update(properties);
            }
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
        const updatePayload = msg.updateDataModel;
        const path = updatePayload.path || '/';
        const value = updatePayload.value;
        surface.dataModel.set(path, value);
      }
    } else {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
    }
  }
}
