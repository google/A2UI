import { DataModel, DataSubscription } from '../state/data-model.js';
import type { DynamicValue, DataBinding, FunctionCall } from '../schema/common-types.js';

/**
 * A contextual view of the main DataModel, serving as the unified interface for resolving 
 * DynamicValues (literals, data paths, function calls) within a specific scope.
 */
export class DataContext {
  /**
   * @param dataModel The shared DataModel instance.
   * @param path The absolute path this context is currently pointing to.
   */
  constructor(
    readonly dataModel: DataModel,
    readonly path: string
  ) { }

  /**
   * Updates the data model at the specified path, resolving it against the current context.
   * This is the only method for mutating the data model.
   */
  set(path: string, value: any): void {
    const absolutePath = this.resolvePath(path);
    this.dataModel.set(absolutePath, value);
  }

  /**
   * Resolves a DynamicValue to its current evaluation.
   * Does not set up any subscriptions.
   */
  resolveDynamicValue<V>(value: DynamicValue): V {
    // 1. Literal Check
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      // TODO: Define error handling when V doesn't match
      return value as V;
    }

    // 2. Path Check: { path: "..." }
    if ('path' in value) {
      const absolutePath = this.resolvePath((value as DataBinding).path);
      return this.dataModel.get(absolutePath);
    }

    // 3. Function Call: { call: "...", args: ... }
    if ('call' in value) {
      // TODO: Implement function calls (expected for now)
      // For now, return as is or undefined
    }

    // TODO: Define error handling when V doesn't match
    return value as V;
  }

  /**
   * Subscribes to changes in a DynamicValue.
   * Returns a Subscription object that provides the current value and allows listening for updates.
   */
  subscribeDynamicValue<V>(value: DynamicValue, onChange: (value: V | undefined) => void): DataSubscription<V> {
    // 1. Literal: Return a static subscription
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {
        // TODO: Define error handling when V doesn't match
        value: value as V,
        unsubscribe: () => { }
      };
    }

    // 2. Path Check: { path: "..." }
    if ('path' in value) {
      const absolutePath = this.resolvePath((value as DataBinding).path);
      return this.dataModel.subscribe(absolutePath, onChange);
    }

    // 3. Function Call (TODO)
    return {
      // TODO: Define error handling when V doesn't match
      value: value as V,
      unsubscribe: () => { }
    };
  }

  /**
   * Creates a new, nested DataContext for a child component.
   * Used by list/template components for their children.
   */
  nested(relativePath: string): DataContext {
    const newPath = this.resolvePath(relativePath);
    return new DataContext(this.dataModel, newPath);
  }

  private resolvePath(path: string): string {
    // Absolute path - no resolution required.
    if (path.startsWith('/')) {
      return path;
    }
    // Handle specific cases like '.' or empty
    if (path === '' || path === '.') {
      return this.path;
    }

    // Normalize current path (remove trailing slash if exists, unless root)
    let base = this.path;
    if (base.endsWith('/') && base.length > 1) {
      base = base.slice(0, -1);
    }
    if (base === '/') base = '';

    return `${base}/${path}`;
  }
}
