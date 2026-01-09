/**
 * A2UI Value Resolver
 * Resolves bound values from the data model
 */

import { getByJsonPointer, isPathReference, isLiteralValue, extractLiteralValue } from './json-pointer';

/**
 * A bound value can be:
 * - A literal value (string, number, boolean, etc.)
 * - A path reference ({ path: "/user/name" })
 * - A v0.8 literal wrapper ({ literalString: "hello" })
 */
export type BoundValue<T = unknown> =
  | T
  | { path: string }
  | { literalString: string }
  | { literalNumber: number }
  | { literalBoolean: boolean };

/**
 * Resolve a potentially bound value from the data model
 */
export function resolveValue<T>(
  value: BoundValue<T>,
  dataModel: Record<string, unknown> | Map<string, unknown>
): T {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value as T;
  }

  // Handle path references
  if (isPathReference(value)) {
    const data = dataModel instanceof Map
      ? Object.fromEntries(dataModel)
      : dataModel;
    return getByJsonPointer(data, value.path) as T;
  }

  // Handle v0.8 literal wrappers
  if (isLiteralValue(value)) {
    return extractLiteralValue(value) as T;
  }

  // Return raw value
  return value as T;
}

/**
 * Check if a value needs resolution (is a path reference)
 */
export function needsResolution(value: unknown): boolean {
  return isPathReference(value);
}

/**
 * Resolve all path references in an object tree
 */
export function resolveDeep<T extends Record<string, unknown>>(
  obj: T,
  dataModel: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isPathReference(value)) {
      result[key] = getByJsonPointer(dataModel, value.path);
    } else if (isLiteralValue(value)) {
      result[key] = extractLiteralValue(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = resolveDeep(value as Record<string, unknown>, dataModel);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? isPathReference(item)
            ? getByJsonPointer(dataModel, item.path)
            : isLiteralValue(item)
              ? extractLiteralValue(item)
              : resolveDeep(item as Record<string, unknown>, dataModel)
          : item
      );
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
