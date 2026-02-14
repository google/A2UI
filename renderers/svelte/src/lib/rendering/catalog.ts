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

import type { Types } from '@a2ui/lit/0.8';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = any;

/**
 * A function that returns a component, either synchronously or as a promise (for lazy loading).
 */
export type ComponentLoader = () => AnyComponent | Promise<{ default: AnyComponent }>;

/**
 * Props mapper function that extracts component-specific props from a component node.
 */
export type PropsMapper<T extends Types.AnyComponentNode = Types.AnyComponentNode> = (
	node: T
) => Record<string, unknown>;

/**
 * A catalog entry defines how to load and configure a component.
 */
export interface CatalogEntry<T extends Types.AnyComponentNode = Types.AnyComponentNode> {
	/**
	 * Function to load the component. Can return a component directly
	 * or a promise for lazy loading.
	 */
	component: ComponentLoader;

	/**
	 * Optional function to extract additional props from the component node.
	 * These props will be spread onto the component in addition to the standard props.
	 */
	props?: PropsMapper<T>;
}

/**
 * The catalog maps component type names to their catalog entries.
 */
export type Catalog = Record<string, CatalogEntry>;

/**
 * Standard props passed to all A2UI components.
 */
export interface StandardComponentProps<T extends Types.AnyComponentNode = Types.AnyComponentNode> {
	surfaceId: Types.SurfaceID | null;
	component: T;
	weight: string | number;
}

/**
 * Helper to create a catalog entry with type inference.
 */
export function catalogEntry<T extends Types.AnyComponentNode>(
	entry: CatalogEntry<T>
): CatalogEntry<T> {
	return entry;
}
