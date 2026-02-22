/**
 * Data Model Store Tests
 */

import {
  isBoundValue,
  isLiteralBoundValue,
  isPathBoundValue,
  getValueAtPath,
  setValueAtPath,
  resolveBoundValue,
  resolveValue,
  resolveStyleValues,
  createRelativeDataContext,
  cloneDataModel,
} from '../state/data-model-store';

describe('BoundValue type guards', () => {
  describe('isBoundValue', () => {
    it('should return true for literal BoundValue', () => {
      expect(isBoundValue({ type: 'literal', value: 'hello' })).toBe(true);
      expect(isBoundValue({ type: 'literal', value: 42 })).toBe(true);
      expect(isBoundValue({ type: 'literal', value: true })).toBe(true);
      expect(isBoundValue({ type: 'literal', value: null })).toBe(true);
    });

    it('should return true for path BoundValue', () => {
      expect(isBoundValue({ type: 'path', path: ['user'] })).toBe(true);
      expect(isBoundValue({ type: 'path', path: ['user', 'name'] })).toBe(true);
    });

    it('should return false for non-BoundValue objects', () => {
      expect(isBoundValue({ type: 'unknown' })).toBe(false);
      expect(isBoundValue({ value: 'hello' })).toBe(false);
      expect(isBoundValue({})).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isBoundValue('hello')).toBe(false);
      expect(isBoundValue(42)).toBe(false);
      expect(isBoundValue(true)).toBe(false);
      expect(isBoundValue(null)).toBe(false);
      expect(isBoundValue(undefined)).toBe(false);
    });
  });

  describe('isLiteralBoundValue', () => {
    it('should return true only for literal type', () => {
      expect(isLiteralBoundValue({ type: 'literal', value: 'hello' })).toBe(true);
      expect(isLiteralBoundValue({ type: 'path', path: ['user'] })).toBe(false);
    });
  });

  describe('isPathBoundValue', () => {
    it('should return true only for path type', () => {
      expect(isPathBoundValue({ type: 'path', path: ['user'] })).toBe(true);
      expect(isPathBoundValue({ type: 'literal', value: 'hello' })).toBe(false);
    });
  });
});

describe('getValueAtPath', () => {
  it('should get values at simple paths', () => {
    const data = { name: 'John', age: 30 };
    expect(getValueAtPath(data, ['name'])).toBe('John');
    expect(getValueAtPath(data, ['age'])).toBe(30);
  });

  it('should get values at nested paths', () => {
    const data = {
      user: {
        profile: {
          name: 'John',
          address: {
            city: 'NYC',
          },
        },
      },
    };
    expect(getValueAtPath(data, ['user', 'profile', 'name'])).toBe('John');
    expect(getValueAtPath(data, ['user', 'profile', 'address', 'city'])).toBe('NYC');
  });

  it('should return undefined for missing paths', () => {
    const data = { name: 'John' };
    expect(getValueAtPath(data, ['missing'])).toBeUndefined();
    expect(getValueAtPath(data, ['name', 'nested'])).toBeUndefined();
  });

  it('should handle empty path', () => {
    const data = { name: 'John' };
    expect(getValueAtPath(data, [])).toEqual(data);
  });

  it('should handle arrays in path', () => {
    const data = {
      items: [
        { name: 'Item 1' },
        { name: 'Item 2' },
      ],
    };
    expect(getValueAtPath(data, ['items', '0', 'name'])).toBe('Item 1');
    expect(getValueAtPath(data, ['items', '1', 'name'])).toBe('Item 2');
  });

  it('should return undefined when traversing null/undefined', () => {
    const data = { user: null };
    expect(getValueAtPath(data, ['user', 'name'])).toBeUndefined();
  });
});

describe('setValueAtPath', () => {
  it('should set values at simple paths', () => {
    const data: Record<string, unknown> = {};
    setValueAtPath(data, ['name'], 'John');
    expect(data.name).toBe('John');
  });

  it('should set values at nested paths, creating intermediates', () => {
    const data: Record<string, unknown> = {};
    setValueAtPath(data, ['user', 'profile', 'name'], 'John');
    expect(data).toEqual({
      user: {
        profile: {
          name: 'John',
        },
      },
    });
  });

  it('should overwrite existing values', () => {
    const data: Record<string, unknown> = { name: 'Old' };
    setValueAtPath(data, ['name'], 'New');
    expect(data.name).toBe('New');
  });

  it('should handle empty path gracefully', () => {
    const data: Record<string, unknown> = { name: 'John' };
    setValueAtPath(data, [], 'value');
    expect(data).toEqual({ name: 'John' });
  });

  it('should replace non-object intermediates', () => {
    const data: Record<string, unknown> = { user: 'string' };
    setValueAtPath(data, ['user', 'name'], 'John');
    expect(data).toEqual({
      user: {
        name: 'John',
      },
    });
  });
});

describe('resolveBoundValue', () => {
  it('should resolve literal values', () => {
    const data = {};
    expect(resolveBoundValue({ type: 'literal', value: 'hello' }, data)).toBe('hello');
    expect(resolveBoundValue({ type: 'literal', value: 42 }, data)).toBe(42);
    expect(resolveBoundValue({ type: 'literal', value: true }, data)).toBe(true);
    expect(resolveBoundValue({ type: 'literal', value: null }, data)).toBe(null);
  });

  it('should resolve path values', () => {
    const data = {
      user: { name: 'John' },
      count: 5,
    };
    expect(resolveBoundValue({ type: 'path', path: ['user', 'name'] }, data)).toBe('John');
    expect(resolveBoundValue({ type: 'path', path: ['count'] }, data)).toBe(5);
  });

  it('should return undefined for missing paths', () => {
    const data = { name: 'John' };
    expect(resolveBoundValue({ type: 'path', path: ['missing'] }, data)).toBeUndefined();
  });
});

describe('resolveValue', () => {
  it('should pass through primitive values', () => {
    const data = {};
    expect(resolveValue('hello', data)).toBe('hello');
    expect(resolveValue(42, data)).toBe(42);
    expect(resolveValue(true, data)).toBe(true);
    expect(resolveValue(null, data)).toBe(null);
  });

  it('should resolve BoundValue objects', () => {
    const data = { color: 'blue' };
    expect(resolveValue({ type: 'literal', value: 'red' }, data)).toBe('red');
    expect(resolveValue({ type: 'path', path: ['color'] }, data)).toBe('blue');
  });

  it('should handle mixed usage', () => {
    const data = { dynamicLabel: 'Click Me' };

    // Static value
    expect(resolveValue('Submit', data)).toBe('Submit');

    // Dynamic value
    expect(resolveValue({ type: 'path', path: ['dynamicLabel'] }, data)).toBe('Click Me');
  });
});

describe('resolveStyleValues', () => {
  it('should resolve all values in a style object', () => {
    const data = { primaryColor: '#007bff', spacing: 16 };
    const style = {
      backgroundColor: { type: 'path' as const, path: ['primaryColor'] },
      padding: { type: 'path' as const, path: ['spacing'] },
      margin: 8,
    };

    const resolved = resolveStyleValues(style, data);

    expect(resolved).toEqual({
      backgroundColor: '#007bff',
      padding: 16,
      margin: 8,
    });
  });

  it('should handle undefined style', () => {
    expect(resolveStyleValues(undefined, {})).toEqual({});
  });

  it('should skip undefined values', () => {
    const style = {
      color: 'red',
      background: undefined,
    };

    const resolved = resolveStyleValues(style, {});
    expect(resolved).toEqual({ color: 'red' });
    expect('background' in resolved).toBe(false);
  });
});

describe('createRelativeDataContext', () => {
  it('should merge parent data with item data', () => {
    const parentData = { theme: 'dark', user: 'John' };
    const itemData = { name: 'Item 1', price: 10 };

    const context = createRelativeDataContext(parentData, itemData, 'item');

    expect(context).toEqual({
      theme: 'dark',
      user: 'John',
      item: { name: 'Item 1', price: 10 },
    });
  });

  it('should use $item as default key', () => {
    const parentData = { theme: 'dark' };
    const itemData = { name: 'Item 1' };

    const context = createRelativeDataContext(parentData, itemData);

    expect(context.$item).toEqual({ name: 'Item 1' });
  });

  it('should handle primitive item data', () => {
    const parentData = { items: [1, 2, 3] };
    const context = createRelativeDataContext(parentData, 'stringItem', 'current');

    expect(context.current).toBe('stringItem');
  });
});

describe('cloneDataModel', () => {
  it('should create a deep copy', () => {
    const original = {
      user: {
        name: 'John',
        settings: { theme: 'dark' },
      },
    };

    const clone = cloneDataModel(original);

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect((clone.user as Record<string, unknown>).settings).not.toBe(
      original.user.settings
    );
  });

  it('should handle arrays', () => {
    const original = {
      items: [1, 2, { nested: true }],
    };

    const clone = cloneDataModel(original);

    expect(clone.items).toEqual(original.items);
    expect(clone.items).not.toBe(original.items);
  });
});
