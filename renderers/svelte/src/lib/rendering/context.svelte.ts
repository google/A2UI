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

import { getContext, setContext } from 'svelte';
import type { SvelteMessageProcessor } from '../data/processor.js';
import type { Types } from '@a2ui/lit/0.8';
import type { Catalog } from './catalog.js';

const PROCESSOR_KEY = Symbol('a2ui-processor');
const THEME_KEY = Symbol('a2ui-theme');
const CATALOG_KEY = Symbol('a2ui-catalog');

/**
 * Set up the A2UI context for child components.
 * Call this in your root Surface component.
 */
export function setA2UIContext(
	processor: SvelteMessageProcessor,
	theme: Types.Theme,
	catalog: Catalog
): void {
	setContext(PROCESSOR_KEY, processor);
	setContext(THEME_KEY, theme);
	setContext(CATALOG_KEY, catalog);
}

/**
 * Get the message processor from context.
 */
export function getProcessor(): SvelteMessageProcessor {
	const processor = getContext<SvelteMessageProcessor>(PROCESSOR_KEY);
	if (!processor) {
		throw new Error('A2UI processor not found in context. Make sure to wrap your component tree with Surface.');
	}
	return processor;
}

/**
 * Get the theme from context.
 */
export function getTheme(): Types.Theme {
	const theme = getContext<Types.Theme>(THEME_KEY);
	if (!theme) {
		throw new Error('A2UI theme not found in context. Make sure to wrap your component tree with Surface.');
	}
	return theme;
}

/**
 * Get the component catalog from context.
 */
export function getCatalog(): Catalog {
	const catalog = getContext<Catalog>(CATALOG_KEY);
	if (!catalog) {
		throw new Error('A2UI catalog not found in context. Make sure to wrap your component tree with Surface.');
	}
	return catalog;
}

/**
 * Try to get the processor, returning undefined if not in context.
 */
export function tryGetProcessor(): SvelteMessageProcessor | undefined {
	return getContext<SvelteMessageProcessor>(PROCESSOR_KEY);
}

/**
 * Try to get the theme, returning undefined if not in context.
 */
export function tryGetTheme(): Types.Theme | undefined {
	return getContext<Types.Theme>(THEME_KEY);
}

/**
 * Try to get the catalog, returning undefined if not in context.
 */
export function tryGetCatalog(): Catalog | undefined {
	return getContext<Catalog>(CATALOG_KEY);
}
