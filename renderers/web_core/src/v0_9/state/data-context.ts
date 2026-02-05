import { DataModel, DataSubscriber, Unsubscribe } from './data-model.js';

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
   * Returns a function to unsubscribe.
   */
  subscribe(path: string, callback: DataSubscriber): Unsubscribe {
    const absolutePath = this.resolvePath(path);
    return this.dataModel.subscribe(absolutePath, callback);
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
