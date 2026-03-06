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

import { Subscription as BaseSubscription } from "../common/events.js";
import { A2uiDataError } from "../errors.js";

/**
 * Represents a reactive connection to a specific path in the data model.
 */
export interface DataSubscription<T> extends BaseSubscription {
  /**
   * The current value at the subscribed path.
   */
  readonly value: T | undefined;
}

class SubscriptionImpl<T> implements DataSubscription<T> {
  private _value: T | undefined;
  private readonly _unsubscribe: () => void;
  public onChange: (value: T | undefined) => void;

  constructor(
    initialValue: T | undefined,
    onChange: (value: T | undefined) => void,
    unsubscribe: () => void,
  ) {
    this._value = initialValue;
    this.onChange = onChange;
    this._unsubscribe = unsubscribe;
  }

  get value(): T | undefined {
    return this._value;
  }

  setValue(value: T | undefined): void {
    this._value = value;
    this.onChange(value);
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
  private readonly subscriptions: Map<string, Set<SubscriptionImpl<any>>> =
    new Map();

  // Batch processing state
  private _batchDepth = 0;
  private _pendingPaths = new Set<string>();

  /**
   * Creates a new data model.
   *
   * @param initialData The initial data for the model. Defaults to an empty object.
   */
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
      throw new A2uiDataError("Path cannot be null or undefined.");
    }
    if (path === "/" || path === "") {
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
        throw new A2uiDataError(
          `Cannot use non-numeric segment '${segment}' on an array in path '${path}'.`,
          path,
        );
      }

      // If we encounter a primitive where a container is expected, we cannot proceed.
      // We allow undefined/null to be overwritten by a new container.
      if (
        current[segment] !== undefined &&
        current[segment] !== null &&
        typeof current[segment] !== "object"
      ) {
        throw new A2uiDataError(
          `Cannot set path '${path}': segment '${segment}' is a primitive value.`,
          path,
        );
      }

      if (current[segment] === undefined || current[segment] === null) {
        const nextSegment =
          i < segments.length - 1 ? segments[i + 1] : lastSegment;
        current[segment] = isNumeric(nextSegment) ? [] : {};
      }
      current = current[segment];
    }

    if (Array.isArray(current) && !isNumeric(lastSegment)) {
      throw new A2uiDataError(
        `Cannot use non-numeric segment '${lastSegment}' on an array in path '${path}'.`,
        path,
      );
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

    if (this._batchDepth > 0) {
      this._pendingPaths.add(path);
    } else {
      this.notifySubscribers(path);
    }
    return this;
  }

  /**
   * Enters batch mode. Notifications will be deferred until endBatch() is called.
   * Supports nested batch calls - only the outermost endBatch() triggers notifications.
   */
  beginBatch(): void {
    this._batchDepth++;
  }

  /**
   * Exits batch mode and triggers all pending notifications.
   * Only triggers when the outermost batch ends (nested batch support).
   */
  endBatch(): void {
    this._batchDepth--;
    if (this._batchDepth > 0) {
      return; // Still in a nested batch
    }

    // Step 1: Collect all pending paths and their ancestors into a Set.
    // This gives us O(1) lookups for descendant checking in Step 2.
    const modifiedPaths = new Set<string>();
    for (const path of this._pendingPaths) {
      const normalizedPath = this.normalizePath(path);
      modifiedPaths.add(normalizedPath);

      // Walk up the ancestor chain
      let parentPath = normalizedPath;
      while (parentPath !== "/" && parentPath !== "") {
        parentPath =
          parentPath.substring(0, parentPath.lastIndexOf("/")) || "/";
        modifiedPaths.add(parentPath);
      }
    }

    // Step 2: Find descendant subscriptions in a single pass over subscriptions.
    // For each subscription, walk up its hierarchy to check if any ancestor
    // is a pending path. This is O(S * D) instead of O(P * S).
    const pathsToNotify = new Set<string>(modifiedPaths);
    for (const subPath of this.subscriptions.keys()) {
      if (pathsToNotify.has(subPath)) {
        continue; // Already included
      }
      // Walk up from subscription path to check if any ancestor was modified
      let ancestor = subPath;
      while (ancestor !== "/" && ancestor !== "") {
        ancestor = ancestor.substring(0, ancestor.lastIndexOf("/")) || "/";
        if (this._pendingPaths.has(ancestor)) {
          pathsToNotify.add(subPath);
          break;
        }
      }
    }

    this._pendingPaths.clear();

    // Notify all collected paths
    for (const path of pathsToNotify) {
      this.notify(path);
    }
  }

  /**
   * Clears all pending notifications without triggering them.
   * Useful when an error occurs during batch processing.
   */
  clearPending(): void {
    this._pendingPaths.clear();
  }

  /**
   * Retrieves data at a specific JSON pointer path.
   *
   * @param path The JSON pointer path to read from.
   * @returns The value at the specified path, or undefined if not found.
   */
  get(path: string): any {
    if (path === null || path === undefined) {
      throw new A2uiDataError("Path cannot be null or undefined.");
    }
    if (path === "/" || path === "") {
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
   * Subscribes to changes at the specified data path.
   *
   * @param path The JSON pointer path to subscribe to.
   * @param onChange The callback to invoke when the data changes.
   * @returns A subscription object that provides the current value and allows unsubscribing.
   */
  subscribe<T>(
    path: string,
    onChange: (value: T | undefined) => void,
  ): DataSubscription<T> {
    const normalizedPath = this.normalizePath(path);
    const initialValue = this.get(normalizedPath);

    const subscription = new SubscriptionImpl<T>(initialValue, onChange, () => {
      const set = this.subscriptions.get(normalizedPath);
      if (set) {
        set.delete(subscription);
        if (set.size === 0) {
          this.subscriptions.delete(normalizedPath);
        }
      }
    });

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
    if (path.length > 1 && path.endsWith("/")) {
      return path.slice(0, -1);
    }
    return path || "/";
  }

  private parsePath(path: string): string[] {
    return path.split("/").filter((p) => p.length > 0);
  }

  private notifySubscribers(path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.notify(normalizedPath);

    // Notify Ancestors
    let parentPath = normalizedPath;
    while (parentPath !== "/" && parentPath !== "") {
      parentPath = parentPath.substring(0, parentPath.lastIndexOf("/")) || "/";
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
    set.forEach((sub) => sub.setValue(value));
  }

  private notifyAllSubscribers(): void {
    for (const path of this.subscriptions.keys()) {
      this.notify(path);
    }
  }

  private isDescendant(childPath: string, parentPath: string): boolean {
    if (parentPath === "/" || parentPath === "") {
      return childPath !== "/";
    }
    return childPath.startsWith(parentPath + "/");
  }
}
