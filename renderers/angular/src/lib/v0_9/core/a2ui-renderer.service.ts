/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable, OnDestroy, inject } from '@angular/core';
import { MessageProcessor, SurfaceGroupModel, ActionListener as ActionHandler, A2uiMessage } from '@a2ui/web_core/v0_9';
import { AngularComponentApi, AngularCatalog } from '../catalog/types';

/**
 * Service responsible for managing A2UI v0.9 rendering sessions.
 * Bridges the A2UI MessageProcessor to Angular-friendly models.
 */
@Injectable()
export class A2uiRendererService implements OnDestroy {
  private _messageProcessor?: MessageProcessor<AngularComponentApi>;
  private _surfaceGroup?: SurfaceGroupModel<AngularComponentApi>;

  private catalog = inject(AngularCatalog);

  /**
   * Initializes the renderer.
   * @param externalActionHandler Optional handler for actions dispatched from surfaces.
   */
  initialize(externalActionHandler?: (action: any) => void): void {
    const actionHandler = (action: any) => {
      if (externalActionHandler) {
        externalActionHandler(action);
      }
    };

    this._messageProcessor = new MessageProcessor<AngularComponentApi>(
      [this.catalog],
      actionHandler,
    );
    this._surfaceGroup = this._messageProcessor.model;
  }

  /**
   * Returns a function invoker that uses the current catalog.
   */
  getFunctionInvoker(): any {
    return this.catalog.invoker;
  }

  /**
   * Processes a list of messages.
   */
  processMessages(messages: A2uiMessage[]): void {
    this._messageProcessor?.processMessages(messages);
  }

  /**
   * Returns the current surface group model.
   */
  get surfaceGroup(): SurfaceGroupModel<AngularComponentApi> | undefined {
    return this._surfaceGroup;
  }

  ngOnDestroy(): void {
    this._surfaceGroup?.dispose();
    // MessageProcessor doesn't have a dispose but it owns the model which does.
  }
}
