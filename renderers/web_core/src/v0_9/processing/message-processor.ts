/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SurfaceModel, ActionListener } from "../state/surface-model.js";
import { Catalog, ComponentApi } from "../catalog/types.js";
import { SurfaceGroupModel } from "../state/surface-group-model.js";
import { ComponentModel } from "../state/component-model.js";
import { Subscription } from "../common/events.js";

import {
  A2uiMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  DeleteSurfaceMessage,
} from "../schema/server-to-client.js";
import { A2uiClientDataModel } from "../schema/client-to-server.js";
import { A2uiStateError, A2uiValidationError } from "../errors.js";

/**
 * The central processor for A2UI messages.
 * @template T The concrete type of the ComponentApi.
 */
export class MessageProcessor<T extends ComponentApi> {
  readonly model: SurfaceGroupModel<T>;

  /**
   * Creates a new message processor.
   *
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
   * Returns the aggregated data model for all surfaces that have 'sendDataModel' enabled.
   */
  getClientDataModel(): A2uiClientDataModel | undefined {
    const surfaces: Record<string, any> = {};

    for (const surface of this.model.surfacesMap.values()) {
      if (surface.sendDataModel) {
        surfaces[surface.id] = surface.dataModel.get("/");
      }
    }

    if (Object.keys(surfaces).length === 0) {
      return undefined;
    }

    return {
      version: "v0.9",
      surfaces,
    };
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
   * Processes a list of messages.
   *
   * @param messages The messages to process.
   */
  processMessages(messages: A2uiMessage[]): void {
    for (const message of messages) {
      this.processMessage(message);
    }
  }

  private processMessage(message: A2uiMessage): void {
    const updateTypes = [
      "createSurface",
      "updateComponents",
      "updateDataModel",
      "deleteSurface",
    ].filter((k) => k in message);

    if (updateTypes.length > 1) {
      throw new A2uiValidationError(
        `Message contains multiple update types: ${updateTypes.join(", ")}.`,
      );
    }

    if ("createSurface" in message) {
      this.processCreateSurfaceMessage(message);
      return;
    }

    if ("deleteSurface" in message) {
      this.processDeleteSurfaceMessage(message);
      return;
    }

    if ("updateComponents" in message) {
      this.processUpdateComponentsMessage(message);
      return;
    }

    if ("updateDataModel" in message) {
      this.processUpdateDataModelMessage(message);
      return;
    }
  }

  private processCreateSurfaceMessage(message: CreateSurfaceMessage): void {
    const payload = message.createSurface;
    const { surfaceId, catalogId, theme, sendDataModel } = payload;

    // Find catalog
    const catalog = this.catalogs.find((c) => c.id === catalogId);
    if (!catalog) {
      throw new A2uiStateError(`Catalog not found: ${catalogId}`);
    }

    if (this.model.getSurface(surfaceId)) {
      throw new A2uiStateError(`Surface ${surfaceId} already exists.`);
    }

    const surface = new SurfaceModel<T>(
      surfaceId,
      catalog,
      theme,
      sendDataModel ?? false,
    );
    this.model.addSurface(surface);
  }

  private processDeleteSurfaceMessage(message: DeleteSurfaceMessage): void {
    const payload = message.deleteSurface;
    if (!payload.surfaceId) return;
    this.model.deleteSurface(payload.surfaceId);
  }

  private processUpdateComponentsMessage(
    message: UpdateComponentsMessage,
  ): void {
    const payload = message.updateComponents;
    if (!payload.surfaceId) return;

    const surface = this.model.getSurface(payload.surfaceId);
    if (!surface) {
      throw new A2uiStateError(
        `Surface not found for message: ${payload.surfaceId}`,
      );
    }

    for (const comp of payload.components) {
      const { id, component, ...properties } = comp;

      if (!id) {
        throw new A2uiValidationError(
          `Component '${component}' is missing an 'id'.`,
        );
      }

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
          throw new A2uiValidationError(
            `Cannot create component ${id} without a type.`,
          );
        }
        const newComponent = new ComponentModel(id, component, properties);
        surface.componentsModel.addComponent(newComponent);
      }
    }
  }

  private processUpdateDataModelMessage(message: UpdateDataModelMessage): void {
    const payload = message.updateDataModel;
    if (!payload.surfaceId) return;

    const surface = this.model.getSurface(payload.surfaceId);
    if (!surface) {
      throw new A2uiStateError(
        `Surface not found for message: ${payload.surfaceId}`,
      );
    }

    const path = payload.path || "/";
    const value = payload.value;
    surface.dataModel.set(path, value);
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
}
