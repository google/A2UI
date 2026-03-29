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
 * Centralized layout mapping utilities for Web/CSS-based renderers.
 *
 * Maps A2UI layout enum values (e.g., `spaceBetween`) to their corresponding
 * CSS values (e.g., `space-between`). These functions are shared across all
 * web renderers (React, Lit, Angular) to ensure consistent behavior.
 */

/**
 * Maps an A2UI justify enum value to its CSS `justify-content` equivalent.
 *
 * @param value - An A2UI justify value such as `'start'`, `'center'`,
 *   `'spaceBetween'`, etc.
 * @returns The corresponding CSS `justify-content` value. Defaults to
 *   `'flex-start'` for unrecognized or undefined input.
 */
const justifyMap: Record<string, string> = {
  center: 'center',
  end: 'flex-end',
  spaceAround: 'space-around',
  spaceBetween: 'space-between',
  spaceEvenly: 'space-evenly',
  start: 'flex-start',
  stretch: 'stretch',
};

export function mapJustify(value?: string): string {
  return (value && justifyMap[value]) || 'flex-start';
}

/**
 * Maps an A2UI align enum value to its CSS `align-items` equivalent.
 *
 * @param value - An A2UI align value such as `'start'`, `'center'`, `'end'`,
 *   or `'stretch'`.
 * @returns The corresponding CSS `align-items` value. Defaults to `'stretch'`
 *   for unrecognized or undefined input.
 */
const alignMap: Record<string, string> = {
  center: 'center',
  end: 'flex-end',
  start: 'flex-start',
  stretch: 'stretch',
};

export function mapAlign(value?: string): string {
  return (value && alignMap[value]) || 'stretch';
}
