import { SurfaceModel, ActionListener } from "../state/surface-model.js";
import { Catalog, ComponentApi } from "../catalog/types.js";
import { SurfaceGroupModel } from "../state/surface-group-model.js";
import { ComponentModel } from "../state/component-model.js";
import { Subscription } from "../common/events.js";

import { A2uiMessage } from "../schema/server-to-client.js";

/**
 * The central processor for A2UI messages.
 * @template T The concrete type of the ComponentApi.
 */
export class MessageProcessor<T extends ComponentApi> {
  readonly model: SurfaceGroupModel<T>;

  /**
   * @param catalogs A list of available catalogs.
   * @param actionHandler A global handler for actions from all surfaces.
   */
  constructor(
    private catalogs: Catalog<T>[],
    private actionHandler?: ActionListener,
  ) {
    this.model = new SurfaceGroupModel<T>();
    if (this.actionHandler) {
      this.model.onAction.subscribe(this.actionHandler);
    }
  }

  /**
   * Subscribes to surface creation events.
   */
  onSurfaceCreated(handler: (surface: SurfaceModel<T>) => void): Subscription {
    return this.model.onSurfaceCreated.subscribe(handler);
  }

  /**
   * Subscribes to surface deletion events.
   */
  onSurfaceDeleted(handler: (id: string) => void): Subscription {
    return this.model.onSurfaceDeleted.subscribe(handler);
  }

  /**
   * Processing a list of messages.
   *
   * @param messages The messages to process.
   */
  processMessages(messages: A2uiMessage[]): void {
    for (const message of messages) {
      this.processMessage(message);
    }
  }

  private processMessage(message: A2uiMessage): void {
    if (message.createSurface) {
      this.processCreateSurfaceMessage(message);
      return;
    }

    const updateTypes = [
      "updateComponents",
      "updateDataModel",
      "deleteSurface",
    ].filter((k) => (message as any)[k]);
    if (updateTypes.length > 1) {
      console.warn(
        `Message contains multiple update types: ${updateTypes.join(", ")}. Ignoring.`,
      );
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

  private processCreateSurfaceMessage(message: A2uiMessage): void {
    const payload = message.createSurface!;
    const { surfaceId, catalogId, theme } = payload;

    // Find catalog
    const catalog = this.catalogs.find((c) => c.id === catalogId);
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

  private processDeleteSurfaceMessage(message: A2uiMessage): void {
    const payload = message.deleteSurface!;
    if (!payload.surfaceId) return;
    this.model.deleteSurface(payload.surfaceId);
  }

  private processUpdateComponentsMessage(message: A2uiMessage): void {
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
          existing.properties = properties;
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

  private processUpdateDataModelMessage(message: A2uiMessage): void {
    const payload = message.updateDataModel!;
    if (!payload.surfaceId) return;

    const surface = this.model.getSurface(payload.surfaceId);
    if (!surface) {
      console.warn(`Surface not found for message: ${payload.surfaceId}`);
      return;
    }

    const path = payload.path || "/";
    const value = payload.value;
    surface.dataModel.set(path, value);
  }

  /**
   * Retrieves data from the data model of a specific surface.
   *
   * @param _component Unused component context.
   * @param path The JSON Pointer path to the data.
   * @param surfaceId The ID of the surface.
   */
  getData(
    _component: { id: string },
    path: string,
    surfaceId?: string,
  ): unknown {
    if (!surfaceId) {
      // Try to find surface by component? Or assume active surface?
      // Without surfaceId, we can't reliably find the data model unless we search all (inefficient/ambiguous).
      // For now returning undefined if no surfaceId.
      return undefined;
    }
    const surface = this.model.getSurface(surfaceId);
    if (!surface) return undefined;

    return surface.dataModel.get(path);
  }

  /**
   * Resolves a relative path against a context path.
   *
   * @param path The path to resolve.
   * @param contextPath The base path (optional).
   */
  resolvePath(path: string, contextPath?: string): string {
    if (path.startsWith("/")) {
      return path;
    }
    if (contextPath) {
      const base = contextPath.endsWith("/") ? contextPath : `${contextPath}/`;
      return `${base}${path}`;
    }
    return `/${path}`;
  }

  /**
   * Updates data in the data model of a specific surface.
   *
   * @param _component Unused component context.
   * @param path The JSON Pointer path where data should be written.
   * @param value The value to write.
   * @param surfaceId The ID of the surface.
   */
  setData(
    _component: { id: string },
    path: string,
    value: unknown,
    surfaceId?: string | null,
  ): void {
    if (!surfaceId) return;
    const surface = this.model.getSurface(surfaceId);
    if (!surface) return;

    surface.dataModel.set(path, value);
  }
}
