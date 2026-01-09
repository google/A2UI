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
import type { Component, AsyncComponent } from 'vue';

/**
 * Injection key for catalog configuration.
 * Used with Vue's provide/inject pattern.
 */
export const CATALOG_KEY = '$a2uiCatalog';

/**
 * A catalog loader can return a Vue component synchronously or asynchronously.
 * Supports both regular components and async components for code splitting.
 */
export type CatalogLoader = () =>
  | Promise<Component>
  | Component
  | AsyncComponent;

/**
 * A catalog entry can be:
 * 1. A simple loader function that returns a component
 * 2. An object with a type loader and a props mapping function
 *
 * The props function is used to extract additional props from the component node
 * that should be passed to the Vue component.
 */
export type CatalogEntry<T extends Types.AnyComponentNode = Types.AnyComponentNode> =
  | CatalogLoader
  | {
      type: CatalogLoader;
      props: (node: T) => Record<string, unknown>;
    };

/**
 * The catalog maps component type names to their implementations.
 * Keys are the A2UI component type names (e.g., "Text", "Button", "Row").
 */
export interface Catalog {
  [key: string]: CatalogEntry<Types.AnyComponentNode>;
}
