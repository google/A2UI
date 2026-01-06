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

import Vue from 'vue';
import type { Types, Primitives } from '@a2ui/lit/0.8';
import type { Theme } from '../theming';
import type { MessageProcessor } from '../../data/processor';
import { THEME_KEY } from '../theming';
import { PROCESSOR_KEY } from '../../data/processor';

let idCounter = 0;

/**
 * Interface describing the properties provided by the DynamicComponentMixin.
 * Components using the mixin should extend this interface for proper typing.
 */
export interface DynamicComponentInstance {
  // Injected properties
  processor: MessageProcessor;
  theme: Theme;
  // Props
  surfaceId: Types.SurfaceID | null;
  component: Types.AnyComponentNode;
  weight: string | number;
  // Computed
  weightStyle: Record<string, string | number>;
  // Methods
  resolvePrimitive(value: Primitives.StringValue | Primitives.BooleanValue | Primitives.NumberValue | null): string | number | boolean | null;
  sendAction(action: Types.Action): Promise<Types.ServerToClientMessage[]>;
  getUniqueId(prefix: string): string;
  setData(path: string, value: Types.DataValue): void;
}

/**
 * Vue mixin that provides common functionality for all A2UI dynamic components.
 * This is the Vue 2 equivalent of Angular's DynamicComponent abstract class.
 *
 * Components using this mixin receive:
 * - Access to the processor and theme via injection
 * - Common props: surfaceId, component, weight
 * - Helper methods: resolvePrimitive, sendAction, getUniqueId
 * - Computed weightStyle for CSS variable
 *
 * Usage:
 * ```typescript
 * import Vue from 'vue';
 * import DynamicComponentMixin from '../rendering/mixins/dynamic-component';
 *
 * export default (Vue as VueConstructor<Vue & DynamicComponentInstance>).extend({
 *   mixins: [DynamicComponentMixin],
 *   // ...
 * });
 * ```
 */
const DynamicComponentMixin = Vue.extend({
  inject: {
    processor: { from: PROCESSOR_KEY },
    theme: { from: THEME_KEY },
  },

  props: {
    surfaceId: {
      type: String,
      required: true,
      default: null,
    },
    component: {
      type: Object,
      required: true,
    },
    weight: {
      type: [String, Number],
      required: true,
    },
  },

  computed: {
    /**
     * CSS style object with the --weight CSS variable.
     * Used for flex-based layout weighting.
     */
    weightStyle(): Record<string, string | number> {
      return { '--weight': this.weight };
    },
  },

  methods: {
    /**
     * Resolves a primitive value (string, number, boolean) from either
     * a literal value or a data binding path.
     *
     * @param value - The value object containing either a literal or a path
     * @returns The resolved value or null if not found
     */
    resolvePrimitive(
      value: Primitives.StringValue | Primitives.BooleanValue | Primitives.NumberValue | null
    ): string | number | boolean | null {
      if (!value || typeof value !== 'object') {
        return null;
      } else if ((value as any).literal != null) {
        return (value as any).literal;
      } else if (value.path) {
        return (this as any).processor.getData(
          this.component,
          value.path,
          this.surfaceId ?? undefined
        ) as string | number | boolean | null;
      } else if ('literalString' in value) {
        return value.literalString ?? null;
      } else if ('literalNumber' in value) {
        return value.literalNumber ?? null;
      } else if ('literalBoolean' in value) {
        return value.literalBoolean ?? null;
      }

      return null;
    },

    /**
     * Sends a user action to the processor, resolving any context data bindings.
     *
     * @param action - The action to send
     * @returns Promise resolving to server response messages
     */
    async sendAction(
      action: Types.Action
    ): Promise<Types.ServerToClientMessage[]> {
      const component = this.component as Types.AnyComponentNode;
      const surfaceId = this.surfaceId ?? undefined;
      const context: Record<string, unknown> = {};
      const processor = (this as any).processor as MessageProcessor;

      if (action.context) {
        for (const item of action.context) {
          if (item.value.literalBoolean !== undefined) {
            context[item.key] = item.value.literalBoolean;
          } else if (item.value.literalNumber !== undefined) {
            context[item.key] = item.value.literalNumber;
          } else if (item.value.literalString !== undefined) {
            context[item.key] = item.value.literalString;
          } else if (item.value.path) {
            const path = processor.resolvePath(item.value.path, component.dataContextPath);
            const value = processor.getData(component, path, surfaceId);
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

      return processor.dispatch(message);
    },

    /**
     * Generates a unique ID for form elements.
     * Useful for associating labels with inputs.
     *
     * @param prefix - Prefix for the generated ID
     * @returns Unique ID string
     */
    getUniqueId(prefix: string): string {
      return `${prefix}-${idCounter++}`;
    },

    /**
     * Sets data in the data model via the processor.
     * Used by input components for two-way binding.
     *
     * @param path - The data path to update
     * @param value - The new value
     */
    setData(
      path: string,
      value: Types.DataValue
    ): void {
      const processor = (this as any).processor as MessageProcessor;
      (processor).setData(this.component as Types.AnyComponentNode, path, value, this.surfaceId ?? undefined);
    },
  },
});

export default DynamicComponentMixin;
