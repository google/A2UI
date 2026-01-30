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

// Re-export core types from @a2ui/lit
export { Types, Primitives, Styles, Data } from '@a2ui/lit/0.8';

// Data module
export { SvelteMessageProcessor, type DispatchedEvent } from './data/index.js';
export { MarkdownRenderer, markdownRenderer } from './data/index.js';

// Rendering module
export {
	setA2UIContext,
	getProcessor,
	getTheme,
	getCatalog,
	tryGetProcessor,
	tryGetTheme,
	tryGetCatalog
} from './rendering/index.js';

export type {
	Catalog,
	CatalogEntry,
	ComponentLoader,
	PropsMapper,
	StandardComponentProps
} from './rendering/index.js';

export { catalogEntry, Renderer } from './rendering/index.js';

// Catalog module
export { DEFAULT_CATALOG, Surface } from './catalog/index.js';

// Utility functions
export {
	classMap,
	styleMap,
	mergeClasses,
	resolvePrimitive,
	resolveString,
	resolveNumber,
	resolveBoolean,
	sendAction,
	generateId
} from './utils/index.js';
