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

import { DataModel } from "./data-model.js";
import { Catalog, ComponentApi } from "../catalog/types.js";
import { SurfaceComponentsModel } from "./surface-components-model.js";
import { EventEmitter, EventSource } from "../common/events.js";

/** A function that listens for actions emitted from a surface. */
export type ActionListener = (action: any) => void | Promise<void>;

/**
 * The state model for a single surface.
 * @template T The concrete type of the ComponentApi.
 */
export class SurfaceModel<T extends ComponentApi> {
  /** The data model for this surface. */
  readonly dataModel: DataModel;
  /** The collection of component models for this surface. */
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
    readonly theme: any = {},
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
