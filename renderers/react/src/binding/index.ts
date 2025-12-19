/**
 * A2UI Data Binding Module
 * Handles JSON Pointer path resolution and data binding
 */

export {
  parsePathSegments,
  getByJsonPointer,
  setByJsonPointer,
  isPathReference,
  isLiteralValue,
  extractLiteralValue,
} from './json-pointer';

export { resolveValue, type BoundValue } from './resolver';
