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

// Core exports
export { provideA2UI, useA2UIConfig } from './config';
export { useMessageProcessor, MessageProcessor } from './data/processor';
export { useMarkdownRenderer } from './data/markdown';
export type { A2AServerPayload, A2TextPayload, A2DataPayload } from './data/types';

// Rendering exports
export { default as A2UiRenderer } from './rendering/A2UIRenderer.vue';
export { useDynamicComponent } from './rendering/useDynamicComponent';
export type { Catalog, CatalogEntry } from './rendering/catalog';
export { DEFAULT_CATALOG } from './catalog/default';

// Component exports
export { default as A2UISurface } from './catalog/A2UISurface.vue';

// Re-export types from @a2ui/web_core
// export type * as Types from '@a2ui/web_core/types/types';
// export type * as Primitives from '@a2ui/web_core/types/primitives';
// export * as Styles from '@a2ui/web_core/styles/index';
