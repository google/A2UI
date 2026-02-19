/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Represents a reactive connection to a specific path in the data model.
 */
export interface Subscription<T> {
  /**
   * The current value at the subscribed path.
   */
  readonly value: T | undefined;

  /**
   * A callback function to be invoked when the value changes.
   */
  onChange?: (value: T | undefined) => void;

  /**
   * Unsubscribes from the data model.
   */
  unsubscribe(): void;
}

class SubscriptionImpl<T> implements Subscription<T> {
  private _value: T | undefined;
  private readonly _unsubscribe: () => void;
  public onChange?: (value: T | undefined) => void;

  constructor(initialValue: T | undefined, unsubscribe: () => void) {
    this._value = initialValue;
    this._unsubscribe = unsubscribe;
  }

  get value(): T | undefined {
    return this._value;
  }

  setValue(value: T | undefined): void {
    this._value = value;
    this.onChange?.(value);
  }

  unsubscribe(): void {
    this._unsubscribe();
  }
}

function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

/**
 * A standalone, observable data store representing the client-side state.
 * It handles JSON Pointer path resolution and subscription management.
 */
export class DataModel {
  private data: Record<string, unknown> = {};
  private readonly subscriptions: Map<string, Set<SubscriptionImpl<any>>> = new Map();

  constructor(initialData: Record<string, unknown> = {}) {
    this.data = initialData;
  }

  /**
   * Updates the model at the specific path and notifies all relevant subscribers.
   * If path is '/' or empty, replaces the entire root.
   *
   * Note on `undefined` values:
   * - For objects: Setting a property to `undefined` removes the key from the object.
   * - For arrays: Setting an index to `undefined` sets that index to `undefined` but preserves the array length (sparse array).
   */
  set(path: string, value: any): this {
    if (path === null || path === undefined) {
      throw new Error("Path cannot be null or undefined.");
    }
    if (path === '/' || path === '') {
      this.data = value;
      this.notifyAllSubscribers();
      return this;
    }

    const segments = this.parsePath(path);
    const lastSegment = segments.pop()!;

    let current: any = this.data;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (Array.isArray(current) && !isNumeric(segment)) {
        throw new Error(`Cannot use non-numeric segment '${segment}' on an array in path '${path}'.`);
      }

      // If we encounter a primitive where a container is expected, we cannot proceed.
      // We allow undefined/null to be overwritten by a new container.
      if (current[segment] !== undefined && current[segment] !== null && typeof current[segment] !== 'object') {
        throw new Error(`Cannot set path '${path}': segment '${segment}' is a primitive value.`);
      }

      if (current[segment] === undefined || current[segment] === null) {
        const nextSegment = (i < segments.length - 1) ? segments[i + 1] : lastSegment;
        current[segment] = isNumeric(nextSegment) ? [] : {};
      }
      current = current[segment];
    }

    if (Array.isArray(current) && !isNumeric(lastSegment)) {
      throw new Error(`Cannot use non-numeric segment '${lastSegment}' on an array in path '${path}'.`);
    }

    if (value === undefined) {
      if (Array.isArray(current)) {
        current[parseInt(lastSegment, 10)] = undefined;
      } else {
        delete current[lastSegment];
      }
    } else {
      current[lastSegment] = value;
    }

    this.notifySubscribers(path);
    return this;
  }

  /**
   * Retrieves data at a specific path.
   */
  get(path: string): any {
    if (path === null || path === undefined) {
      throw new Error("Path cannot be null or undefined.");
    }
    if (path === '/' || path === '') {
      return this.data;
    }

    const segments = this.parsePath(path);
    let current: any = this.data;
    for (const segment of segments) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  }

  /**
   * Subscribes to changes at a specific path. Returns a Subscription object.
   */
  subscribe<T>(path: string): Subscription<T> {
    const normalizedPath = this.normalizePath(path);
    const initialValue = this.get(normalizedPath);

    const subscription = new SubscriptionImpl<T>(
      initialValue,
      () => {
        const set = this.subscriptions.get(normalizedPath);
        if (set) {
          set.delete(subscription);
          if (set.size === 0) {
            this.subscriptions.delete(normalizedPath);
          }
        }
      }
    );

    if (!this.subscriptions.has(normalizedPath)) {
      this.subscriptions.set(normalizedPath, new Set());
    }
    this.subscriptions.get(normalizedPath)!.add(subscription);

    return subscription;
  }

  /**
   * Clears all internal subscriptions.
   */
  dispose(): void {
    this.subscriptions.clear();
  }

  private normalizePath(path: string): string {
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }
    return path || '/';
  }

  private parsePath(path: string): string[] {
    return path.split('/').filter(p => p.length > 0);
  }

  private notifySubscribers(path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.notify(normalizedPath);

    // Notify Ancestors
    let parentPath = normalizedPath;
    while (parentPath !== '/' && parentPath !== '') {
      parentPath = parentPath.substring(0, parentPath.lastIndexOf('/')) || '/';
      this.notify(parentPath);
    }

    // Notify Descendants
    for (const subPath of this.subscriptions.keys()) {
      if (this.isDescendant(subPath, normalizedPath)) {
        this.notify(subPath);
      }
    }
  }

  private notify(path: string): void {
    const set = this.subscriptions.get(path);
    if (!set) {
      return;
    }
    const value = this.get(path);
    set.forEach(sub => sub.setValue(value));
  }

  private notifyAllSubscribers(): void {
    for (const path of this.subscriptions.keys()) {
      this.notify(path);
    }
  }

  private isDescendant(childPath: string, parentPath: string): boolean {
    if (parentPath === '/' || parentPath === '') {
      return childPath !== '/';
    }
    return childPath.startsWith(parentPath + '/');
  }
}
