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

/**
 * @a2ui/vue2 - Vue 2 renderer for A2UI
 *
 * This package provides a complete Vue 2.6 Options API implementation
 * for rendering A2UI components. It includes all 18 standard components
 * and integrates with the @a2ui/lit package for data processing and types.
 *
 * ## Quick Start
 *
 * ```ts
 * import Vue from 'vue';
 * import { A2UIPlugin, DEFAULT_CATALOG } from '@a2ui/vue2';
 *
 * // Define your theme
 * const myTheme = {
 *   components: { ... },
 *   elements: { ... },
 *   markdown: { ... },
 * };
 *
 * // Install the plugin
 * Vue.use(A2UIPlugin, {
 *   catalog: DEFAULT_CATALOG,
 *   theme: myTheme,
 * });
 * ```
 *
 * ## Usage in Components
 *
 * ```vue
 * <template>
 *   <Surface
 *     :surface-id="surfaceId"
 *     :surface="surface"
 *   />
 * </template>
 *
 * <script>
 * import { Surface } from '@a2ui/vue2';
 *
 * export default {
 *   components: { Surface },
 *   // ...
 * };
 * </script>
 * ```
 */

// Rendering exports
export {
  THEME_KEY,
  type Theme,
} from './lib/rendering/theming';

export {
  CATALOG_KEY,
  type Catalog,
  type CatalogEntry,
  type CatalogLoader,
} from './lib/rendering/catalog';

export {
  default as DynamicComponentMixin,
  type DynamicComponentInstance,
} from './lib/rendering/mixins/dynamic-component';

export {
  default as A2UIRenderer,
} from './lib/rendering/renderer.vue';

// Data exports
export {
  PROCESSOR_KEY,
  MessageProcessor,
  type DispatchedEvent,
} from './lib/data/processor';

export {
  MarkdownRenderer,
  markdownRenderer,
} from './lib/data/markdown';

export type {
  A2TextPayload,
  A2DataPayload,
  A2AServerPayload,
} from './lib/data/types';

// Config exports
export {
  A2UIPlugin,
  createA2UIProviders,
  createA2UIProvidersWithProcessor,
  type A2UIPluginOptions,
} from './lib/config';

// Catalog exports
export {
  DEFAULT_CATALOG,
} from './lib/catalog/default';

export {
  default as Surface,
} from './lib/catalog/surface.vue';

// Re-export types from @a2ui/lit for convenience
export type { Types, Primitives, Styles } from '@a2ui/lit/0.8';
