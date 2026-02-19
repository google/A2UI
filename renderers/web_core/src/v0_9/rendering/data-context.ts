import { DataModel, Subscription } from '../state/data-model.js';

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
  resolveDynamicValue<V>(value: any): V {
    // 1. Literal Check
    if (typeof value !== 'object' || value === null) {
      return value as V;
    }

    // 2. Path Check: { path: "..." }
    if ('path' in value && typeof value.path === 'string') {
      const absolutePath = this.resolvePath(value.path);
      return this.dataModel.get(absolutePath);
    }

    // 3. Function Call: { call: "...", args: ... }
    if ('call' in value) {
      // TODO: Implement function calls
      // For now, return as is or undefined
    }

    return value as V;
  }

  /**
   * Subscribes to changes in a DynamicValue.
   * Returns a Subscription object that provides the current value and allows listening for updates.
   */
  subscribeDynamicValue<V>(value: any): Subscription<V> {
    // 1. Literal: Return a static subscription
    if (typeof value !== 'object' || value === null) {
      return {
        value: value as V,
        onChange: undefined,
        unsubscribe: () => {}
      };
    }

    // 2. Path Check: { path: "..." }
    if ('path' in value && typeof value.path === 'string') {
      const absolutePath = this.resolvePath(value.path);
      return this.dataModel.subscribe(absolutePath);
    }

    // 3. Function Call (TODO)
    // For now, treat as static
    return {
      value: value as V,
      onChange: undefined,
      unsubscribe: () => {}
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
