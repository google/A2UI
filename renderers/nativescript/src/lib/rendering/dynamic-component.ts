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

import { Types, Primitives } from '@a2ui/lit/0.8';
import { Directive, inject, input, Input, computed } from '@angular/core';
import { MessageProcessor } from '../data';
import { Theme } from './theming';

let idCounter = 0;

@Directive()
export abstract class DynamicComponent<T extends Types.AnyComponentNode = Types.AnyComponentNode> {
  protected readonly processor = inject(MessageProcessor, { optional: true });
  protected readonly theme = inject(Theme, { optional: true });

  readonly surfaceId = input<Types.SurfaceID | null>(null);
  readonly component = input<T | null>(null);
  readonly weight = input<string | number>('initial');
  
  // Alternative input for simpler usage
  @Input() node: T | null = null;
  
  // Helper to get the node from either input
  protected get currentNode(): T | null {
    return this.node ?? this.component();
  }

  protected sendAction(action: Types.Action): Promise<Types.ServerToClientMessage[]> {
    const component = this.currentNode;
    if (!component) {
      console.warn('No component/node available for action');
      return Promise.resolve([]);
    }
    
    const surfaceId = this.surfaceId() ?? undefined;
    const context: Record<string, unknown> = {};

    if (action.context && this.processor) {
      for (const item of action.context) {
        if (item.value.literalBoolean) {
          context[item.key] = item.value.literalBoolean;
        } else if (item.value.literalNumber) {
          context[item.key] = item.value.literalNumber;
        } else if (item.value.literalString) {
          context[item.key] = item.value.literalString;
        } else if (item.value.path) {
          const path = this.processor.resolvePath(item.value.path, component.dataContextPath);
          const value = this.processor.getData(component, path, surfaceId);
          context[item.key] = value;
        }
      }
    }

    const message: Types.A2UIClientEventMessage = {
      userAction: {
        name: action.name,
        sourceComponentId: component.id,
        surfaceId: surfaceId!,
        timestamp: new Date().toISOString(),
        context,
      },
    };

    if (this.processor) {
      return this.processor.dispatch(message);
    }
    
    // Fallback: just log the action
    console.log('Action dispatched:', message);
    return Promise.resolve([]);
  }

  protected resolvePrimitive(value: Primitives.StringValue | null): string | null;
  protected resolvePrimitive(value: Primitives.BooleanValue | null): boolean | null;
  protected resolvePrimitive(value: Primitives.NumberValue | null): number | null;
  protected resolvePrimitive(
    value: Primitives.StringValue | Primitives.BooleanValue | Primitives.NumberValue | null,
  ) {
    const component = this.currentNode;
    const surfaceId = this.surfaceId();

    if (!value || typeof value !== 'object') {
      return null;
    } else if (value.literal != null) {
      return value.literal;
    } else if (value.path && component && this.processor) {
      return this.processor.getData(component, value.path, surfaceId ?? undefined);
    } else if ('literalString' in value) {
      return value.literalString;
    } else if ('literalNumber' in value) {
      return value.literalNumber;
    } else if ('literalBoolean' in value) {
      return value.literalBoolean;
    }

    return null;
  }

  protected getUniqueId(prefix: string) {
    return `${prefix}-${idCounter++}`;
  }
}
