import { SurfaceModel, ActionListener } from '../state/surface-model.js';
import { CatalogApi } from '../catalog/types.js';
import { SurfaceGroupModel, SurfaceLifecycleListener } from '../state/surface-group-model.js';
import { ComponentModel } from '../state/component-model.js';

export type { SurfaceLifecycleListener };

import { A2UIMessage } from './messages.js';

/**
 * The central processor for A2UI messages.
 * @template T The concrete type of the Catalog, which extends CatalogApi.
 */
export class MessageProcessor<T extends CatalogApi> {
  readonly model: SurfaceGroupModel<T>;

  /**
   * @param catalogs A list of available catalogs.
   * @param actionHandler A global handler for actions from all surfaces.
   */
  constructor(
    private catalogs: T[],
    private actionHandler: ActionListener
  ) {
    this.model = new SurfaceGroupModel<T>();
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

  processMessages(messages: A2UIMessage[]): void {
    for (const message of messages) {
      this.processMessage(message);
    }
  }

  getSurfaceModel(surfaceId: string): SurfaceModel<T> | undefined {
    return this.model.getSurface(surfaceId);
  }

  private processMessage(message: A2UIMessage): void {
    if (message.createSurface) {
      this.processCreateSurfaceMessage(message);
      return;
    }

    const updateTypes = ['updateComponents', 'updateDataModel', 'deleteSurface'].filter(k => (message as any)[k]);
    if (updateTypes.length > 1) {
      console.warn(`Message contains multiple update types: ${updateTypes.join(', ')}. Ignoring.`);
      return;
    }

    if (message.deleteSurface) {
      this.processDeleteSurfaceMessage(message);
      return;
    }

    if (message.updateComponents) {
      this.processUpdateComponentsMessage(message);
      return;
    }

    if (message.updateDataModel) {
      this.processUpdateDataModelMessage(message);
      return;
    }
  }

  private processCreateSurfaceMessage(message: A2UIMessage): void {
    const payload = message.createSurface!;
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
  }

  private processDeleteSurfaceMessage(message: A2UIMessage): void {
    const payload = message.deleteSurface!;
    if (!payload.surfaceId) return;
    this.model.deleteSurface(payload.surfaceId);
  }

  private processUpdateComponentsMessage(message: A2UIMessage): void {
    const payload = message.updateComponents!;
    if (!payload.surfaceId) return;

    const surface = this.model.getSurface(payload.surfaceId);
    if (!surface) {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
      return;
    }

    for (const comp of payload.components) {
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
  }

  private processUpdateDataModelMessage(message: A2UIMessage): void {
    const payload = message.updateDataModel!;
    if (!payload.surfaceId) return;

    const surface = this.model.getSurface(payload.surfaceId);
    if (!surface) {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
      return;
    }

    const path = payload.path || '/';
    const value = payload.value;
    surface.dataModel.set(path, value);
  }
}
