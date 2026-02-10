/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * JSON Pointer (RFC 6901) Implementation
 * https://tools.ietf.org/html/rfc6901
 *
 * This implementation provides robust handling of JSON Pointer operations
 * with comprehensive edge case handling and RFC 6901 compliance.
 *
 * Contributed to help with Issue #173 - dataModelUpdate handling
 */

/**
 * JSON Pointer error class
 */
export class JSONPointerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JSONPointerError'
  }
}

/**
 * JSON Pointer utility class
 * Implements RFC 6901 for JSON data navigation
 */
export class JSONPointer {
  /**
   * Resolve a JSON Pointer path in an object
   *
   * @param object - The object to navigate
   * @param pointer - JSON Pointer string (e.g., "/user/name")
   * @returns The resolved value or undefined if not found
   *
   * @example
   * const data = { user: { name: 'Alice' } }
   * JSONPointer.resolve(data, '/user/name')  // 'Alice'
   */
  static resolve<T = unknown>(object: unknown, pointer: string): T | undefined {
    if (!pointer || pointer === '' || pointer === '/') {
      return object as T
    }

    if (!pointer.startsWith('/')) {
      throw new JSONPointerError(`Invalid JSON Pointer: must start with "/" (got "${pointer}")`)
    }

    const tokens = this.compile(pointer)
    let current: unknown = object

    for (const token of tokens) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof current !== 'object') {
        return undefined
      }

      // Handle arrays
      if (Array.isArray(current)) {
        const index = this.parseArrayIndex(token, current.length)
        if (index === -1) {
          return undefined
        }
        current = current[index]
      }
      // Handle objects
      else {
        current = (current as Record<string, unknown>)[token]
      }
    }

    return current as T
  }

  /**
   * Set a value at a JSON Pointer path
   *
   * @param object - The object to modify
   * @param pointer - JSON Pointer string
   * @param value - Value to set
   *
   * @example
   * const data = { user: {} }
   * JSONPointer.set(data, '/user/name', 'Bob')
   * // data is now { user: { name: 'Bob' } }
   */
  static set(object: unknown, pointer: string, value: unknown): void {
    if (!pointer || pointer === '') {
      throw new JSONPointerError('Cannot set root value')
    }

    if (!pointer.startsWith('/')) {
      throw new JSONPointerError(`Invalid JSON Pointer: must start with "/" (got "${pointer}")`)
    }

    const tokens = this.compile(pointer)
    const lastToken = tokens.pop()

    if (lastToken === undefined) {
      throw new JSONPointerError('Invalid JSON Pointer: no tokens')
    }

    // Navigate to parent
    let current: unknown = object
    for (const token of tokens) {
      if (current === null || current === undefined) {
        throw new JSONPointerError(`Cannot navigate through null/undefined at "/${tokens.join('/')}"`)
      }

      if (typeof current !== 'object') {
        throw new JSONPointerError(`Cannot navigate through non-object at "/${tokens.join('/')}"`)
      }

      // Handle arrays
      if (Array.isArray(current)) {
        const index = this.parseArrayIndex(token, current.length)
        if (index === -1) {
          throw new JSONPointerError(`Invalid array index: "${token}"`)
        }
        current = current[index]
      }
      // Handle objects
      else {
        const obj = current as Record<string, unknown>
        if (!(token in obj)) {
          // Create intermediate object
          obj[token] = {}
        }
        current = obj[token]
      }
    }

    // Set value at final location
    if (current === null || current === undefined) {
      throw new JSONPointerError('Cannot set value on null/undefined')
    }

    if (typeof current !== 'object') {
      throw new JSONPointerError('Cannot set value on non-object')
    }

    // Handle arrays
    if (Array.isArray(current)) {
      if (lastToken === '-') {
        // Append to array
        current.push(value)
      } else {
        const index = this.parseArrayIndex(lastToken, current.length)
        if (index === -1) {
          throw new JSONPointerError(`Invalid array index: "${lastToken}"`)
        }
        current[index] = value
      }
    }
    // Handle objects
    else {
      (current as Record<string, unknown>)[lastToken] = value
    }
  }

  /**
   * Remove a value at a JSON Pointer path
   *
   * @param object - The object to modify
   * @param pointer - JSON Pointer string
   * @returns true if removed, false if path not found
   *
   * @example
   * const data = { user: { name: 'Alice', age: 30 } }
   * JSONPointer.remove(data, '/user/age')
   * // data is now { user: { name: 'Alice' } }
   */
  static remove(object: unknown, pointer: string): boolean {
    if (!pointer || pointer === '') {
      throw new JSONPointerError('Cannot remove root value')
    }

    if (!pointer.startsWith('/')) {
      throw new JSONPointerError(`Invalid JSON Pointer: must start with "/" (got "${pointer}")`)
    }

    const tokens = this.compile(pointer)
    const lastToken = tokens.pop()

    if (lastToken === undefined) {
      throw new JSONPointerError('Invalid JSON Pointer: no tokens')
    }

    // Navigate to parent
    let current: unknown = object
    for (const token of tokens) {
      if (current === null || current === undefined) {
        return false
      }

      if (typeof current !== 'object') {
        return false
      }

      // Handle arrays
      if (Array.isArray(current)) {
        const index = this.parseArrayIndex(token, current.length)
        if (index === -1) {
          return false
        }
        current = current[index]
      }
      // Handle objects
      else {
        const obj = current as Record<string, unknown>
        if (!(token in obj)) {
          return false
        }
        current = obj[token]
      }
    }

    // Remove value at final location
    if (current === null || current === undefined) {
      return false
    }

    if (typeof current !== 'object') {
      return false
    }

    // Handle arrays
    if (Array.isArray(current)) {
      const index = this.parseArrayIndex(lastToken, current.length)
      if (index === -1 || index >= current.length) {
        return false
      }
      current.splice(index, 1)
      return true
    }
    // Handle objects
    else {
      const obj = current as Record<string, unknown>
      if (!(lastToken in obj)) {
        return false
      }
      delete obj[lastToken]
      return true
    }
  }

  /**
   * Compile a JSON Pointer into an array of reference tokens
   *
   * @param pointer - JSON Pointer string
   * @returns Array of unescaped tokens
   *
   * @example
   * JSONPointer.compile('/user/profile/name')
   * // ['user', 'profile', 'name']
   */
  static compile(pointer: string): string[] {
    if (!pointer || pointer === '') {
      return []
    }

    if (!pointer.startsWith('/')) {
      throw new JSONPointerError(`Invalid JSON Pointer: must start with "/" (got "${pointer}")`)
    }

    // Remove leading "/" and split
    return pointer
      .slice(1)
      .split('/')
      .map((token) => this.unescape(token))
  }

  /**
   * Unescape a JSON Pointer token
   * Per RFC 6901: ~1 -> /, ~0 -> ~
   */
  private static unescape(token: string): string {
    return token.replace(/~1/g, '/').replace(/~0/g, '~')
  }

  /**
   * Parse array index from token
   * Returns -1 if invalid
   */
  private static parseArrayIndex(token: string, arrayLength: number): number {
    // "-" means append (only valid for set operation)
    if (token === '-') {
      return arrayLength
    }

    // Must be non-negative integer
    if (!/^\d+$/.test(token)) {
      return -1
    }

    const index = parseInt(token, 10)

    // Reject leading zeros (except "0" itself)
    if (token.length > 1 && token.startsWith('0')) {
      return -1
    }

    return index
  }
}
