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

/**
 * Converts a camelCase icon name to snake_case for use with Material Symbols.
 *
 * The Material Symbols font uses snake_case names (e.g., "shopping_cart"),
 * but A2UI icon names may be provided in camelCase (e.g., "shoppingCart").
 * This utility normalizes them so all renderers behave consistently.
 *
 * @example
 * toSnakeCase('shoppingCart') // -> 'shopping_cart'
 * toSnakeCase('home')         // -> 'home'
 */
export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * CSS classes for Google Symbols.
 *
 * Usage:
 *
 * ```html
 * <span class="g-icon">pen_spark</span>
 * ```
 */
export const icons = `
  .g-icon {
    font-family: "Material Symbols Outlined", "Google Symbols";
    font-weight: normal;
    font-style: normal;
    font-display: optional;
    font-size: 20px;
    width: 1em;
    height: 1em;
    user-select: none;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-feature-settings: "liga";
    -webkit-font-smoothing: antialiased;
    overflow: hidden;

    font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 48,
      "ROND" 100;

    &.filled {
      font-variation-settings: "FILL" 1, "wght" 300, "GRAD" 0, "opsz" 48,
        "ROND" 100;
    }

    &.filled-heavy {
      font-variation-settings: "FILL" 1, "wght" 700, "GRAD" 0, "opsz" 48,
        "ROND" 100;
    }
  }
`;
