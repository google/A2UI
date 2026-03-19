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
import { AngularComponentImplementation, AngularCatalog } from '../catalog/types';

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
 * Injection token for the A2UI renderer configuration.
 */
export const A2UI_RENDERER_CONFIG = new InjectionToken<RendererConfiguration>(
  'A2UI_RENDERER_CONFIG',
);

/**
 * Manages A2UI v0.9 rendering sessions by bridging the MessageProcessor to Angular.
 *
 * This service is responsible for processing incoming A2UI messages and making the
 * resulting surface models available to Angular components.
 */
@Injectable()
export class A2uiRendererService implements OnDestroy {
  private _messageProcessor: MessageProcessor<AngularComponentImplementation>;
  private _catalogs: AngularCatalog[] = [];

  constructor(@Inject(A2UI_RENDERER_CONFIG) private config: RendererConfiguration) {
    this._catalogs = this.config.catalogs;

    this._messageProcessor = new MessageProcessor<AngularComponentImplementation>(
      this._catalogs,
      this.config.actionHandler as ActionHandler,
    );
  }

  /**
   * Processes a list of A2UI messages and updates the internal model.
   *
   * @param messages The list of messages to process.
   */
  processMessages(messages: A2uiMessage[]): void {
    this._messageProcessor.processMessages(messages);
  }

  /**
   * The current surface group model containing all active surfaces.
   */
  get surfaceGroup(): SurfaceGroupModel<AngularComponentImplementation> {
    return this._messageProcessor.model;
  }

  ngOnDestroy(): void {
    this._messageProcessor.model.dispose();
  }
}
