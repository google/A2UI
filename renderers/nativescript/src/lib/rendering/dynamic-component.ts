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

import { Types } from '@a2ui/lit/0.8';
import { Directive, inject, input } from '@angular/core';
import { MessageProcessor } from '../data';
import { Theme } from './theming';

@Directive()
export abstract class DynamicComponent<T extends Types.AnyComponentNode = Types.AnyComponentNode> {
  protected readonly processor = inject(MessageProcessor);
  protected readonly theme = inject(Theme);

  readonly surfaceId = input.required<Types.SurfaceID | null>();
  readonly component = input.required<T>();
  readonly weight = input.required<string | number>();

  protected sendAction(action: Types.Action): Promise<Types.ServerToClientMessage[]> {
    const component = this.component();
    const surfaceId = this.surfaceId() ?? undefined;
    const context: Record<string, unknown> = {};

    if (action.context) {
      for (const item of action.context) {
        if (item.value.literalBoolean) {
          context[item.key] = item.value.literalBoolean;
        } else if (item.value.literalNumber) {
          context[item.key] = item.value.literalNumber;
        } else if (item.value.literalString) {
          context[item.key] = item.value.literalString;
        } else if (item.value.path) {
          const value = this.processor.getData(component, item.value.path, surfaceId);
          if (value !== undefined) {
            context[item.key] = value;
          }
        }
      }
    }

    return this.processor.dispatch({
      action: action.action,
      context,
      surfaceId,
    });
  }
}
