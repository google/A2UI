/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { inject, Injectable, signal } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { A2UIClient } from './client';

@Injectable({ providedIn: 'root' })
export class ModelProcessor {
  private readonly a2uiClient = inject(A2UIClient);
  private readonly processor = new v0_8.Data.A2UIModelProcessor();
  readonly isLoading = signal(false);

  getSurfaces() {
    return this.processor.getSurfaces();
  }

  resolvePath(path: string, dataContextPath?: string) {
    return this.processor.resolvePath(path, dataContextPath);
  }

  setData(
    node: v0_8.Types.AnyComponentNode,
    relativePath: string,
    value: v0_8.Types.DataValue,
    surfaceId?: v0_8.Types.SurfaceID | null
  ) {
    return this.processor.setData(node, relativePath, value, surfaceId ?? undefined);
  }

  getData(
    node: v0_8.Types.AnyComponentNode,
    relativePath: string,
    surfaceId?: string
  ): v0_8.Types.DataValue | null {
    return this.processor.getData(node, relativePath, surfaceId);
  }

  async makeRequest(request: v0_8.Types.A2UIClientEventMessage | string) {
    let messages: v0_8.Types.ServerToClientMessage[];

    try {
      this.isLoading.set(true);
      const response = await this.a2uiClient.send(request as v0_8.Types.A2UIClientEventMessage);
      this.isLoading.set(false);
      messages = response;
    } catch (err) {
      console.error(err);
      messages = [];
    } finally {
      this.isLoading.set(false);
    }

    this.processor.clearSurfaces();
    this.processor.processMessages(messages);
    return messages;
  }
}
