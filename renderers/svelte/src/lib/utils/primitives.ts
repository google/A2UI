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

import type { Types, Primitives } from '@a2ui/lit/0.8';
import type { SvelteMessageProcessor } from '../data/processor.js';

/**
 * Resolve a primitive value (string, number, or boolean) from either
 * a literal value or a data model path.
 */
export function resolvePrimitive(
	processor: SvelteMessageProcessor,
	component: Types.AnyComponentNode,
	surfaceId: Types.SurfaceID | null | undefined,
	value: Primitives.StringValue | Primitives.BooleanValue | Primitives.NumberValue | null
): string | number | boolean | null {
	if (!value || typeof value !== 'object') {
		return null;
	}

	// Handle unified 'literal' property (legacy format)
	if ('literal' in value && value.literal != null) {
		return value.literal;
	}

	// Handle path-based values
	if (value.path) {
		return processor.getData(component, value.path, surfaceId ?? undefined) as
			| string
			| number
			| boolean
			| null;
	}

	// Handle specific literal types
	if ('literalString' in value && value.literalString != null) {
		return value.literalString;
	}
	if ('literalNumber' in value && value.literalNumber != null) {
		return value.literalNumber;
	}
	if ('literalBoolean' in value && value.literalBoolean != null) {
		return value.literalBoolean;
	}

	return null;
}

/**
 * Resolve a string value specifically.
 */
export function resolveString(
	processor: SvelteMessageProcessor,
	component: Types.AnyComponentNode,
	surfaceId: Types.SurfaceID | null | undefined,
	value: Primitives.StringValue | null
): string | null {
	const result = resolvePrimitive(processor, component, surfaceId, value);
	return result !== null ? String(result) : null;
}

/**
 * Resolve a number value specifically.
 */
export function resolveNumber(
	processor: SvelteMessageProcessor,
	component: Types.AnyComponentNode,
	surfaceId: Types.SurfaceID | null | undefined,
	value: Primitives.NumberValue | null
): number | null {
	const result = resolvePrimitive(processor, component, surfaceId, value);
	return result !== null ? Number(result) : null;
}

/**
 * Resolve a boolean value specifically.
 */
export function resolveBoolean(
	processor: SvelteMessageProcessor,
	component: Types.AnyComponentNode,
	surfaceId: Types.SurfaceID | null | undefined,
	value: Primitives.BooleanValue | null
): boolean | null {
	const result = resolvePrimitive(processor, component, surfaceId, value);
	return result !== null ? Boolean(result) : null;
}

/**
 * Dispatch a user action to the processor.
 */
export function sendAction(
	processor: SvelteMessageProcessor,
	component: Types.AnyComponentNode,
	surfaceId: Types.SurfaceID | null | undefined,
	action: Types.Action
): Promise<Types.ServerToClientMessage[]> {
	const context: Record<string, unknown> = {};

	if (action.context) {
		for (const item of action.context) {
			if (item.value.literalBoolean != null) {
				context[item.key] = item.value.literalBoolean;
			} else if (item.value.literalNumber != null) {
				context[item.key] = item.value.literalNumber;
			} else if (item.value.literalString != null) {
				context[item.key] = item.value.literalString;
			} else if (item.value.path) {
				const path = processor.resolvePath(item.value.path, component.dataContextPath);
				const value = processor.getData(component, path, surfaceId ?? undefined);
				context[item.key] = value;
			}
		}
	}

	const message: Types.A2UIClientEventMessage = {
		userAction: {
			name: action.name,
			sourceComponentId: component.id,
			surfaceId: surfaceId!,
			timestamp: new Date().toISOString(),
			context
		}
	};

	return processor.dispatch(message);
}

let idCounter = 0;

/**
 * Generate a unique ID with the given prefix.
 */
export function generateId(prefix: string): string {
	return `${prefix}-${idCounter++}`;
}
