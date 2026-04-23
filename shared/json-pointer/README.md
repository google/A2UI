# JSON Pointer (RFC 6901) Implementation

Production-ready, RFC 6901 compliant JSON Pointer implementation for A2UI data model operations.

## Purpose

This implementation provides robust JSON Pointer handling to support Issue #173's proposed solutions for `dataModelUpdate`. Whether using complete flattening (ID-based) or partial flattening approaches, this utility handles:

- Complex nested object navigation
- Array index operations (including edge cases)
- Special character escaping (~0, ~1)
- Comprehensive error handling

## Features

- ✅ **RFC 6901 Compliant** - Full specification implementation
- ✅ **100% Type-Safe** - TypeScript strict mode
- ✅ **Zero Dependencies** - Pure TypeScript
- ✅ **Production-Tested** - 100% test coverage (28/28 tests passing)
- ✅ **Edge Case Handling** - Handles all RFC 6901 edge cases

## Usage

```typescript
import { JSONPointer } from './json-pointer'

const data = {
  user: {
    profile: { name: 'Alice' },
    items: ['a', 'b', 'c']
  }
}

// Resolve paths
JSONPointer.resolve(data, '/user/profile/name')  // 'Alice'
JSONPointer.resolve(data, '/user/items/1')       // 'b'

// Set values
JSONPointer.set(data, '/user/profile/age', 30)
// data.user.profile.age is now 30

// Remove values
JSONPointer.remove(data, '/user/items/1')
// data.user.items is now ['a', 'c']

// Compile pointers to tokens
JSONPointer.compile('/user/profile/name')
// ['user', 'profile', 'name']
```

## Relation to Issue #173

This implementation serves as infrastructure for whatever solution is chosen for Issue #173:

1. **For Complete Flattening:** Can be used to translate between flat ID structures and traditional paths
2. **For Partial Flattening:** Handles map navigation while ID-based arrays avoid index problems
3. **For Current Schema:** Provides robust handling of existing dataModelUpdate operations

The implementation's comprehensive edge case handling (array bounds, null/undefined, escaping) makes it production-ready for any approach.

## API

### `resolve<T>(object, pointer): T | undefined`
Navigate to a value in an object using a JSON Pointer path.

### `set(object, pointer, value): void`
Set a value at a JSON Pointer path (creates intermediate objects as needed).

### `remove(object, pointer): boolean`
Remove a value at a JSON Pointer path. Returns true if removed, false if not found.

### `compile(pointer): string[]`
Parse a JSON Pointer into an array of unescaped reference tokens.

## Testing

Comprehensive test suite included at `tests/json-pointer.test.ts` with 100% coverage:
- Simple and nested path resolution
- Array operations (valid/invalid indices, bounds checking, append with "-")
- Object operations
- Edge cases (null, undefined, special characters, leading zeros)
- Error conditions
- Escaping rules (~0 for ~, ~1 for /)

## Integration

This utility can be integrated into:
- `renderers/lit` - For dataModel operations
- `renderers/angular` - For dataModel operations
- Any future renderer implementations
- Tools requiring data model manipulation

## License

Apache 2.0 (see LICENSE file in repository root)
