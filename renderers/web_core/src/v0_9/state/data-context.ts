import { DataModel, Subscription } from './data-model.js';

/**
 * A contextual view of the main DataModel, used by components to resolve relative and absolute paths.
 * It acts as a localized "window" into the state.
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
   * Subscribes to a path, resolving it against the current context.
   * Returns a Subscription object.
   */
  subscribe<T>(path: string): Subscription<T> {
    const absolutePath = this.resolvePath(path);
    return this.dataModel.subscribe(absolutePath);
  }

  /**
   * Gets a snapshot value, resolving the path against the current context.
   */
  getValue<T>(path: string): T {
    const absolutePath = this.resolvePath(path);
    return this.dataModel.get(absolutePath);
  }

  /**
   * Updates the data model, resolving the path against the current context.
   */
  update(path: string, value: any): void {
    const absolutePath = this.resolvePath(path);
    this.dataModel.set(absolutePath, value);
  }

  /**
   * Resolves a value which might be a literal, a path object, or a function call.
   * This method performs the evaluation (e.g. looking up path values), but does NOT 
   * set up subscriptions.
   */
  resolve<V>(value: any): V {
    // 1. Literal Check
    if (typeof value !== 'object' || value === null) {
      return value as V;
    }

    // 2. Path Check: { path: "..." }
    if ('path' in value && typeof value.path === 'string') {
      return this.getValue(value.path);
    }

    // 3. Function Call: { call: "...", args: ... }
    if ('call' in value) {
      // TODO: Implement function calls
      // For now, return as is or undefined?
      // Leaving placeholder logic similar to original ComponentContext
    }

    return value as V;
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
