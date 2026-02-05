export type DataSubscriber = (value: any) => void;
export type Unsubscribe = () => void;

/**
 * A standalone, observable data store representing the client-side state.
 * It handles JSON Pointer path resolution and subscription management.
 */
export class DataModel {
  private data: any = {};
  private subscribers: Map<string, Set<DataSubscriber>> = new Map();

  constructor(initialData: any = {}) {
    this.data = initialData;
  }

  /**
   * Updates the model at the specific path.
   * If path is '/' or empty, replaces the entire root.
   */
  set(path: string, value: any): void {
    if (path === '/' || path === '') {
      const oldValue = this.data;
      this.data = value;
      this.notify(path, value);
      // When root changes, everything changes.
      // We should ideally notify all specific path subscribers too,
      // or they should re-evaluate.
      // For simplicity in this implementation, we verify if we need to deep notify.
      // Actually, standard behavior: root change notifies root subscribers.
      // But if someone subscribed to /user/name, they are affected too.
      // We will iterate all subscribers for root change.
      this.notifyAllSubscribers();
      return;
    }

    const segments = this.parsePath(path);
    const lastSegment = segments.pop();
    if (!lastSegment) return; // Should be covered by root check above

    let current = this.data;
    for (const segment of segments) {
      if (current[segment] === undefined || current[segment] === null) {
        current[segment] = {};
      }
      current = current[segment];
    }

    const oldValue = current[lastSegment];

    // If value is undefined, we might want to delete the key? 
    // The spec says "If omitted, the key at 'path' is removed." for updateDataModel message.
    // But here we are setting a value. If value is undefined, we delete.
    if (value === undefined) {
      delete current[lastSegment];
    } else {
      current[lastSegment] = value;
    }

    // Notify logic
    // 1. Exact match
    this.notify(path, value);

    // 2. Ancestors (e.g. setting /a/b/c notifies /a/b and /a)
    let parentPath = path;
    while (parentPath !== '/' && parentPath !== '') {
      parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
      if (parentPath === '') parentPath = '/';
      const parentValue = this.get(parentPath);
      this.notify(parentPath, parentValue);
      if (parentPath === '/') break;
    }

    // 3. Descendants (e.g. setting /a notifies /a/b)
    // We scan subscribers to see if any are children of the modified path
    for (const subPath of this.subscribers.keys()) {
      if (this.isDescendant(subPath, path)) {
        const subValue = this.get(subPath);
        this.notify(subPath, subValue);
      }
    }
  }

  /**
   * Retrieves data at a specific path.
   * Returns undefined if path does not exist.
   */
  get(path: string): any {
    if (path === '/' || path === '') return this.data;

    const segments = this.parsePath(path);
    let current = this.data;
    for (const segment of segments) {
      if (current === undefined || current === null) return undefined;
      current = current[segment];
    }
    return current;
  }

  /**
   * Subscribes to changes at a specific path.
   * The callback is invoked whenever the value at 'path' (or its ancestors/descendants) changes.
   */
  subscribe(path: string, callback: DataSubscriber): Unsubscribe {
    // Normalize path to ensure consistency
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path)!.add(callback);

    // Initial call? Usually not in this pattern, but sometimes useful. 
    // Spec doesn't strictly say initial value must be pushed, usually 'subscribe' is for future updates.
    // We will stick to future updates only.

    return () => {
      const pathSubs = this.subscribers.get(path);
      if (pathSubs) {
        pathSubs.delete(callback);
        if (pathSubs.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }

  private parsePath(path: string): string[] {
    // Simple JSON Pointer parser: /a/b/c -> ['a', 'b', 'c']
    return path.split('/').filter(p => p.length > 0);
  }

  private notify(path: string, newValue: any) {
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    const subs = this.subscribers.get(path);
    if (subs) {
      subs.forEach(cb => cb(newValue));
    }
  }

  private notifyAllSubscribers() {
    for (const [path, subs] of this.subscribers) {
      const value = this.get(path);
      subs.forEach(cb => cb(value));
    }
  }

  private isDescendant(childPath: string, parentPath: string): boolean {
    if (parentPath === '/' || parentPath === '') return true;
    return childPath.startsWith(parentPath + '/');
  }
}
