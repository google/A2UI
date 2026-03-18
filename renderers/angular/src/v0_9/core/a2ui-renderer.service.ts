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

import { Injectable, OnDestroy, InjectionToken, Inject } from '@angular/core';
import {
  MessageProcessor,
  SurfaceGroupModel,
  ActionListener as ActionHandler,
  A2uiMessage,
  SurfaceGroupAction,
} from '@a2ui/web_core/v0_9';
import { AngularComponentApi, AngularCatalog } from '../catalog/types';

/**
 * Configuration for the A2UI renderer.
 */
export interface RendererConfiguration {
  /** The catalogs containing the available components and functions. */
  catalogs: AngularCatalog[];
  /** Optional handler for actions dispatched from any surface. */
  actionHandler?: (action: SurfaceGroupAction) => void;
}

/**
 * Injection token for A2UI Renderer Configuration.
 */
export const A2UI_RENDERER_CONFIG = new InjectionToken<RendererConfiguration>(
  'A2UI_RENDERER_CONFIG',
);

/**
 * Service responsible for managing A2UI v0.9 rendering sessions.
 * Bridges the A2UI MessageProcessor to Angular-friendly models.
 */
@Injectable()
export class A2uiRendererService implements OnDestroy {
  private _messageProcessor: MessageProcessor<AngularComponentApi>;
  private _catalogs: AngularCatalog[] = [];

  constructor(@Inject(A2UI_RENDERER_CONFIG) private config: RendererConfiguration) {
    this._catalogs = this.config.catalogs;

    this._messageProcessor = new MessageProcessor<AngularComponentApi>(
      this._catalogs,
      this.config.actionHandler as ActionHandler,
    );
  }

  /**
   * Processes a list of messages.
   */
  processMessages(messages: A2uiMessage[]): void {
    this._messageProcessor.processMessages(messages);
  }

  /**
   * Returns the current surface group model.
   */
  get surfaceGroup(): SurfaceGroupModel<AngularComponentApi> {
    return this._messageProcessor.model;
  }

  ngOnDestroy(): void {
    this._messageProcessor.model.dispose();
  }
}
