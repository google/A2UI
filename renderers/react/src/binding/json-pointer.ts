/**
 * JSON Pointer (RFC 6901) implementation
 * Supports both /user/name JSON Pointer syntax and legacy dot notation
 */

/**
 * Parse a JSON Pointer path into segments
 * RFC 6901: /foo/bar/0 → ['foo', 'bar', '0']
 * Legacy: foo.bar.0 → ['foo', 'bar', '0']
 */
export function parsePathSegments(path: string): string[] {
  if (!path) return [];

  // JSON Pointer format (starts with /)
  if (path.startsWith('/')) {
    return path
      .slice(1)
      .split('/')
      .map((segment) =>
        // RFC 6901 escape sequences: ~1 → /, ~0 → ~
        segment.replace(/~1/g, '/').replace(/~0/g, '~')
      );
  }

  // Legacy dot notation (for backwards compatibility)
  return path.split('.');
}

/**
 * Get value at JSON Pointer path from an object
 */
export function getByJsonPointer(obj: unknown, path: string): unknown {
  const segments = parsePathSegments(path);

  return segments.reduce((current: unknown, segment: string) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object') {
      // Array index access
      if (Array.isArray(current)) {
        const index = parseInt(segment, 10);
        if (!isNaN(index)) {
          return current[index];
        }
      }
      // Object property access
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, obj);
}

/**
 * Set value at JSON Pointer path in an object (immutably)
 * Returns a new object with the value set
 */
export function setByJsonPointer<T>(
  obj: T,
  path: string,
  value: unknown
): T {
  const segments = parsePathSegments(path);
  if (segments.length === 0) {
    return value as T;
  }

  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  let current: unknown = result;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    const next = (current as Record<string, unknown>)[segment];

    if (next === null || next === undefined || typeof next !== 'object') {
      // Create intermediate object or array
      const nextSegment = segments[i + 1];
      const isArrayIndex = !isNaN(parseInt(nextSegment, 10));
      (current as Record<string, unknown>)[segment] = isArrayIndex ? [] : {};
    } else {
      // Clone the intermediate object
      (current as Record<string, unknown>)[segment] = Array.isArray(next)
        ? [...next]
        : { ...next };
    }

    current = (current as Record<string, unknown>)[segment];
  }

  const lastSegment = segments[segments.length - 1];
  (current as Record<string, unknown>)[lastSegment] = value;

  return result as T;
}

/**
 * Check if a value is a path reference
 */
export function isPathReference(value: unknown): value is { path: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof (value as { path: unknown }).path === 'string'
  );
}

/**
 * Check if a value is a literal value (A2UI v0.8 format)
 */
export function isLiteralValue(
  value: unknown
): value is
  | { literalString: string }
  | { literalNumber: number }
  | { literalBoolean: boolean } {
  if (typeof value !== 'object' || value === null) return false;
  return 'literalString' in value || 'literalNumber' in value || 'literalBoolean' in value;
}

/**
 * Extract value from literal wrapper
 */
export function extractLiteralValue(value: unknown): unknown {
  if (!isLiteralValue(value)) return value;

  if ('literalString' in value) return value.literalString;
  if ('literalNumber' in value) return value.literalNumber;
  if ('literalBoolean' in value) return value.literalBoolean;

  return value;
}
