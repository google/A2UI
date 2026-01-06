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

import type { VueConstructor } from 'vue';
import type { Catalog } from './rendering/catalog';
import type { Theme } from './rendering/theming';
import { CATALOG_KEY } from './rendering/catalog';
import { THEME_KEY } from './rendering/theming';
import { PROCESSOR_KEY, MessageProcessor } from './data/processor';

/**
 * Configuration options for the A2UI Vue plugin.
 */
export interface A2UIPluginOptions {
  /**
   * The component catalog mapping A2UI types to Vue components.
   * Use DEFAULT_CATALOG for standard components or provide a custom catalog.
   */
  catalog: Catalog;

  /**
   * Theme configuration for styling components.
   */
  theme: Theme;

  /**
   * Optional MessageProcessor instance.
   * If not provided, a new instance will be created.
   */
  processor?: MessageProcessor;
}

/**
 * Vue 2 plugin for providing A2UI configuration globally.
 *
 * Usage:
 * ```ts
 * import Vue from 'vue';
 * import { A2UIPlugin, DEFAULT_CATALOG } from '@a2ui/vue2';
 * import { myTheme } from './theme';
 *
 * Vue.use(A2UIPlugin, {
 *   catalog: DEFAULT_CATALOG,
 *   theme: myTheme,
 * });
 * ```
 *
 * After installation, all A2UI components will have access to:
 * - The catalog via inject
 * - The theme via inject
 * - The processor via inject
 */
export const A2UIPlugin = {
  install(Vue: VueConstructor, options: A2UIPluginOptions): void {
    if (!options) {
      throw new Error('A2UIPlugin requires options with catalog and theme');
    }

    if (!options.catalog) {
      throw new Error('A2UIPlugin requires a catalog');
    }

    if (!options.theme) {
      throw new Error('A2UIPlugin requires a theme');
    }

    const processor = options.processor ?? new MessageProcessor();

    // Provide values globally using Vue.mixin with provide
    Vue.mixin({
      provide(this: { $parent?: unknown }) {
        // Only provide from root component
        if (this.$parent) {
          return {};
        }
        return {
          [CATALOG_KEY]: options.catalog,
          [THEME_KEY]: options.theme,
          [PROCESSOR_KEY]: processor,
        };
      },
    });

    // Also add to prototype for easy access
    Vue.prototype[CATALOG_KEY] = options.catalog;
    Vue.prototype[THEME_KEY] = options.theme;
    Vue.prototype[PROCESSOR_KEY] = processor;
  },
};

/**
 * Creates A2UI providers for use with Vue's provide/inject.
 * Use this when you need to provide A2UI at a specific component level
 * rather than globally via the plugin.
 *
 * Usage:
 * ```ts
 * export default {
 *   provide() {
 *     return createA2UIProviders({
 *       catalog: DEFAULT_CATALOG,
 *       theme: myTheme,
 *     });
 *   },
 * };
 * ```
 *
 * @param options - A2UI configuration options
 * @returns Provider object for use with Vue's provide
 */
export function createA2UIProviders(options: A2UIPluginOptions): Record<string, unknown> {
  const processor = options.processor ?? new MessageProcessor();

  return {
    [CATALOG_KEY]: options.catalog,
    [THEME_KEY]: options.theme,
    [PROCESSOR_KEY]: processor,
  };
}

/**
 * Returns the processor from the providers.
 * Useful when you need access to the processor instance after creating providers.
 *
 * @param options - A2UI configuration options
 * @returns Object containing providers and the processor instance
 */
export function createA2UIProvidersWithProcessor(options: A2UIPluginOptions): {
  providers: Record<string, unknown>;
  processor: MessageProcessor;
} {
  const processor = options.processor ?? new MessageProcessor();

  return {
    providers: {
      [CATALOG_KEY]: options.catalog,
      [THEME_KEY]: options.theme,
      [PROCESSOR_KEY]: processor,
    },
    processor,
  };
}
