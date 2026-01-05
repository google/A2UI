/**
 * Data Model Store
 *
 * Handles A2UI data binding resolution. Components can reference values
 * in the data model using BoundValue objects with path-based references.
 */

import type { BoundValue, LiteralBoundValue, PathBoundValue } from '../types/a2ui-types';

/**
 * Check if a value is a BoundValue object
 */
export function isBoundValue(value: unknown): value is BoundValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value.type === 'literal' || value.type === 'path')
  );
}

/**
 * Check if a value is a literal BoundValue
 */
export function isLiteralBoundValue(value: unknown): value is LiteralBoundValue {
  return isBoundValue(value) && value.type === 'literal';
}

/**
 * Check if a value is a path BoundValue
 */
export function isPathBoundValue(value: unknown): value is PathBoundValue {
  return isBoundValue(value) && value.type === 'path';
}

/**
 * Get a value from the data model at a given path
 *
 * @example
 * ```typescript
 * const data = { user: { name: 'John', address: { city: 'NYC' } } };
 * getValueAtPath(data, ['user', 'name']); // 'John'
 * getValueAtPath(data, ['user', 'address', 'city']); // 'NYC'
 * getValueAtPath(data, ['user', 'missing']); // undefined
 * ```
 */
export function getValueAtPath(
  dataModel: Record<string, unknown>,
  path: string[]
): unknown {
  let current: unknown = dataModel;

  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Set a value in the data model at a given path
 * Creates intermediate objects as needed.
 *
 * @example
 * ```typescript
 * const data = {};
 * setValueAtPath(data, ['user', 'name'], 'John');
 * // data = { user: { name: 'John' } }
 * ```
 */
export function setValueAtPath(
  dataModel: Record<string, unknown>,
  path: string[],
  value: unknown
): void {
  if (path.length === 0) {
    return;
  }

  let current = dataModel;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }

  current[path[path.length - 1]] = value;
}

/**
 * Resolve a BoundValue to its actual value
 *
 * @example
 * ```typescript
 * const data = { userName: 'Alice' };
 *
 * resolveBoundValue({ type: 'literal', value: 'Hello' }, data);
 * // 'Hello'
 *
 * resolveBoundValue({ type: 'path', path: ['userName'] }, data);
 * // 'Alice'
 * ```
 */
export function resolveBoundValue(
  boundValue: BoundValue,
  dataModel: Record<string, unknown>
): unknown {
  if (boundValue.type === 'literal') {
    return boundValue.value;
  }

  if (boundValue.type === 'path') {
    return getValueAtPath(dataModel, boundValue.path);
  }

  return undefined;
}

/**
 * Resolve a value that may or may not be a BoundValue
 * If it's a primitive, return as-is. If it's a BoundValue, resolve it.
 *
 * @example
 * ```typescript
 * const data = { color: 'blue' };
 *
 * resolveValue('red', data); // 'red'
 * resolveValue({ type: 'path', path: ['color'] }, data); // 'blue'
 * resolveValue(42, data); // 42
 * ```
 */
export function resolveValue<T>(
  value: T | BoundValue,
  dataModel: Record<string, unknown>
): T | unknown {
  if (isBoundValue(value)) {
    return resolveBoundValue(value, dataModel);
  }

  return value;
}

/**
 * Resolve multiple values in a style object
 *
 * @example
 * ```typescript
 * const data = { primaryColor: '#007bff' };
 * const style = {
 *   backgroundColor: { type: 'path', path: ['primaryColor'] },
 *   padding: 10,
 * };
 *
 * resolveStyleValues(style, data);
 * // { backgroundColor: '#007bff', padding: 10 }
 * ```
 */
export function resolveStyleValues(
  style: Record<string, BoundValue | string | number | undefined> | undefined,
  dataModel: Record<string, unknown>
): Record<string, unknown> {
  if (!style) {
    return {};
  }

  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value !== undefined) {
      resolved[key] = resolveValue(value, dataModel);
    }
  }

  return resolved;
}

/**
 * Create a relative data context for list item rendering
 * Combines parent data model with item-specific data
 *
 * @example
 * ```typescript
 * const parentData = { theme: 'dark' };
 * const itemData = { name: 'Item 1', price: 10 };
 *
 * createRelativeDataContext(parentData, itemData, 'item');
 * // { theme: 'dark', item: { name: 'Item 1', price: 10 } }
 * ```
 */
export function createRelativeDataContext(
  parentDataModel: Record<string, unknown>,
  itemData: unknown,
  itemKey: string = '$item'
): Record<string, unknown> {
  return {
    ...parentDataModel,
    [itemKey]: itemData,
  };
}

/**
 * Deep clone a data model (for immutable updates)
 */
export function cloneDataModel(dataModel: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(dataModel));
}
