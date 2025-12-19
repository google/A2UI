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
 * Convert a class map (object with boolean values) to a class string.
 * Only classes with truthy values are included.
 */
export function classMap(classes: Record<string, boolean> | undefined): string {
	if (!classes) return '';
	return Object.entries(classes)
		.filter(([, enabled]) => enabled)
		.map(([className]) => className)
		.join(' ');
}

/**
 * Convert a style object to a CSS style string.
 */
export function styleMap(styles: Record<string, string | number | undefined> | undefined): string {
	if (!styles) return '';
	return Object.entries(styles)
		.filter(([, value]) => value !== undefined && value !== '')
		.map(([prop, value]) => `${prop}: ${value}`)
		.join('; ');
}

/**
 * Merge multiple class maps, with later maps taking precedence.
 */
export function mergeClasses(
	...maps: (Record<string, boolean> | undefined)[]
): Record<string, boolean> {
	const result: Record<string, boolean> = {};
	for (const map of maps) {
		if (map) {
			Object.assign(result, map);
		}
	}
	return result;
}
