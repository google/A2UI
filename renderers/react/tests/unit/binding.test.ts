/**
 * JSON Pointer and Data Binding Unit Tests
 * Tests RFC 6901 JSON Pointer implementation and value resolution
 */

import { describe, it, expect } from 'vitest'
import {
  getByJsonPointer,
  setByJsonPointer,
  parsePathSegments,
  isPathReference,
  isLiteralValue,
  extractLiteralValue,
} from '../../src/a2ui/binding/json-pointer'
import {
  resolveValue,
  needsResolution,
  resolveDeep,
} from '../../src/a2ui/binding/resolver'

// ===========================================================================
// JSON Pointer Tests (RFC 6901)
// ===========================================================================

describe('JSON Pointer', () => {
  describe('getByJsonPointer', () => {
    const data = {
      foo: 'bar',
      nested: {
        deep: {
          value: 42,
        },
      },
      items: ['first', 'second', 'third'],
      'special/key': 'escaped-slash',
      'tilde~key': 'escaped-tilde',
    }

    it('returns root for empty path', () => {
      expect(getByJsonPointer(data, '')).toEqual(data)
    })

    it('gets simple top-level property', () => {
      expect(getByJsonPointer(data, '/foo')).toBe('bar')
    })

    it('gets nested property', () => {
      expect(getByJsonPointer(data, '/nested/deep/value')).toBe(42)
    })

    it('gets array element by index', () => {
      expect(getByJsonPointer(data, '/items/0')).toBe('first')
      expect(getByJsonPointer(data, '/items/1')).toBe('second')
      expect(getByJsonPointer(data, '/items/2')).toBe('third')
    })

    it('handles escaped slash (~1)', () => {
      expect(getByJsonPointer(data, '/special~1key')).toBe('escaped-slash')
    })

    it('handles escaped tilde (~0)', () => {
      expect(getByJsonPointer(data, '/tilde~0key')).toBe('escaped-tilde')
    })

    it('returns undefined for non-existent path', () => {
      expect(getByJsonPointer(data, '/nonexistent')).toBeUndefined()
      expect(getByJsonPointer(data, '/nested/missing')).toBeUndefined()
    })

    it('handles paths without leading slash (convenience)', () => {
      expect(getByJsonPointer(data, 'foo')).toBe('bar')
    })

    it('works with object data structure', () => {
      const data = {
        user: { name: 'John' },
        count: 5,
      }

      expect(getByJsonPointer(data, '/user')).toEqual({ name: 'John' })
      expect(getByJsonPointer(data, '/count')).toBe(5)
    })
  })

  describe('setByJsonPointer', () => {
    it('sets top-level property (returns new object)', () => {
      const data: Record<string, unknown> = {}
      const result = setByJsonPointer(data, '/foo', 'bar')
      expect(result.foo).toBe('bar')
    })

    it('sets nested property (creates intermediates)', () => {
      const data: Record<string, unknown> = {}
      const result = setByJsonPointer(data, '/a/b/c', 'deep')
      expect((result.a as Record<string, unknown>).b).toEqual({ c: 'deep' })
    })

    it('sets array element', () => {
      const data = { items: ['a', 'b', 'c'] }
      const result = setByJsonPointer(data, '/items/1', 'updated')
      expect(result.items[1]).toBe('updated')
    })
  })

  describe('parsePathSegments', () => {
    it('parses simple path', () => {
      expect(parsePathSegments('/foo/bar')).toEqual(['foo', 'bar'])
    })

    it('handles escaped characters', () => {
      expect(parsePathSegments('/foo~1bar/baz~0qux')).toEqual(['foo/bar', 'baz~qux'])
    })

    it('handles empty path', () => {
      expect(parsePathSegments('')).toEqual([])
    })

    it('handles root only', () => {
      expect(parsePathSegments('/')).toEqual([''])
    })
  })

  describe('path reference detection', () => {
    it('isPathReference detects path objects', () => {
      expect(isPathReference({ path: '/foo' })).toBe(true)
      expect(isPathReference({ path: '/nested/value' })).toBe(true)
    })

    it('isPathReference returns false for non-paths', () => {
      expect(isPathReference('string')).toBe(false)
      expect(isPathReference(123)).toBe(false)
      expect(isPathReference({ other: 'key' })).toBe(false)
      expect(isPathReference(null)).toBe(false)
      expect(isPathReference(undefined)).toBe(false)
    })

    it('isLiteralValue detects literal wrappers', () => {
      expect(isLiteralValue({ literalString: 'value' })).toBe(true)
      expect(isLiteralValue({ literalNumber: 123 })).toBe(true)
      expect(isLiteralValue({ literalBoolean: true })).toBe(true)
    })

    it('extractLiteralValue unwraps literals', () => {
      expect(extractLiteralValue({ literalString: 'value' })).toBe('value')
      expect(extractLiteralValue({ literalNumber: 42 })).toBe(42)
      expect(extractLiteralValue({ literalBoolean: false })).toBe(false)
    })
  })
})

// ===========================================================================
// Value Resolution Tests
// ===========================================================================

describe('Value Resolution', () => {
  const dataModel = new Map<string, unknown>([
    ['name', 'John'],
    ['count', 42],
    ['user', { name: 'Jane', age: 30 }],
    ['settings', { theme: 'dark' }],
  ])

  describe('resolveValue', () => {
    it('resolves path reference', () => {
      const result = resolveValue({ path: '/name' }, dataModel)
      expect(result).toBe('John')
    })

    it('resolves nested path', () => {
      const result = resolveValue({ path: '/user' }, dataModel)
      expect(result).toEqual({ name: 'Jane', age: 30 })
    })

    it('resolves nested path through object hierarchy', () => {
      // The path /settings/theme navigates: obj.settings.theme
      const result = resolveValue({ path: '/settings/theme' }, dataModel)
      expect(result).toBe('dark')
    })

    it('returns literal string as-is', () => {
      const result = resolveValue('literal string', dataModel)
      expect(result).toBe('literal string')
    })

    it('returns literal number as-is', () => {
      const result = resolveValue(123, dataModel)
      expect(result).toBe(123)
    })

    it('returns literal boolean as-is', () => {
      const result = resolveValue(true, dataModel)
      expect(result).toBe(true)
    })

    it('returns undefined for missing path', () => {
      const result = resolveValue({ path: '/missing' }, dataModel)
      expect(result).toBeUndefined()
    })

    it('handles null and undefined', () => {
      expect(resolveValue(null, dataModel)).toBe(null)
      expect(resolveValue(undefined, dataModel)).toBe(undefined)
    })
  })

  describe('resolveDeep', () => {
    // resolveDeep needs an object data model (not Map)
    const objectDataModel = {
      name: 'John',
      count: 42,
      user: { name: 'Jane', age: 30 },
    }

    it('resolves all paths in nested object', () => {
      const input = {
        title: { path: '/name' },
        subtitle: 'Static text',
        nested: {
          value: { path: '/count' },
        },
      }

      const result = resolveDeep(input, objectDataModel)

      expect(result).toEqual({
        title: 'John',
        subtitle: 'Static text',
        nested: {
          value: 42,
        },
      })
    })

    it('resolves paths in arrays within object', () => {
      const input = {
        items: [
          { path: '/name' },
          'static',
          { path: '/count' },
        ],
      }

      const result = resolveDeep(input, objectDataModel)

      expect(result).toEqual({
        items: ['John', 'static', 42],
      })
    })

    it('handles mixed nested structures', () => {
      const input = {
        users: [
          { name: { path: '/name' } },
          { name: 'Static User' },
        ],
        config: {
          count: { path: '/count' },
          enabled: true,
        },
      }

      const result = resolveDeep(input, objectDataModel)

      expect(result).toEqual({
        users: [
          { name: 'John' },
          { name: 'Static User' },
        ],
        config: {
          count: 42,
          enabled: true,
        },
      })
    })
  })

  describe('needsResolution', () => {
    it('returns true for path reference', () => {
      expect(needsResolution({ path: '/foo' })).toBe(true)
    })

    it('returns false for nested objects (only checks direct path reference)', () => {
      // needsResolution only checks if the value itself is a path reference
      // It does NOT recursively check nested objects
      const obj = {
        static: 'value',
        dynamic: { path: '/foo' },
      }
      expect(needsResolution(obj)).toBe(false)
    })

    it('returns false for plain values', () => {
      expect(needsResolution('string')).toBe(false)
      expect(needsResolution(123)).toBe(false)
      expect(needsResolution(true)).toBe(false)
      expect(needsResolution(null)).toBe(false)
    })

    it('returns false for objects without paths', () => {
      expect(needsResolution({ foo: 'bar' })).toBe(false)
      expect(needsResolution({ nested: { value: 1 } })).toBe(false)
    })
  })
})
