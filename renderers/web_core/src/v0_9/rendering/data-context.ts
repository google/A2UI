/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Observable, of, combineLatest, isObservable } from "rxjs";
import { map, switchMap, skip } from "rxjs/operators";
import { DataModel, DataSubscription } from "../state/data-model.js";
import type {
  DynamicValue,
  DataBinding,
  FunctionCall,
} from "../schema/common-types.js";

/** A function that invokes a catalog function by name and returns its result synchronously or as an Observable. */
export type FunctionInvoker = (
  name: string,
  args: Record<string, any>,
  context: DataContext,
) => any;

/**
 * A contextual view of the main DataModel, serving as the unified interface for resolving
 * DynamicValues (literals, data paths, function calls) within a specific scope.
 */
export class DataContext {
  private readonly _errors: string[] = [];

  /**
   * @param dataModel The shared DataModel instance.
   * @param path The absolute path this context is currently pointing to.
   * @param functionInvoker An optional invoker for resolving function calls against a catalog.
   */
  constructor(
    readonly dataModel: DataModel,
    readonly path: string,
    readonly functionInvoker?: FunctionInvoker,
  ) {}

  /** Returns any resolution errors encountered by this context. */
  get errors(): readonly string[] {
    return this._errors;
  }

  /** Appends an error to the resolution context. */
  reportError(error: string): void {
    this._errors.push(error);
  }

  /** Clears all accumulated errors. */
  clearErrors(): void {
    this._errors.length = 0;
  }

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
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      // TypeScript erases types at runtime, so we return the literal as V.
      // Schema validation handles strict type checking.
      return value as V;
    }

    // 2. Path Check: { path: "..." }
    if ("path" in value) {
      const absolutePath = this.resolvePath((value as DataBinding).path);
      return this.dataModel.get(absolutePath);
    }

    // 3. Function Call: { call: "...", args: ... }
    if ("call" in value) {
      const call = value as FunctionCall;
      const args: Record<string, any> = {};

      // Resolve arguments recursively
      for (const [key, argVal] of Object.entries(call.args)) {
        args[key] = this.resolveDynamicValue(argVal);
      }

      // Evaluate function
      // Note: sync resolution of async functions returns the Observable itself
      if (!this.functionInvoker) {
        this.reportError(`Function not found: ${call.call}`);
        return undefined as unknown as V;
      }

      const result = this.functionInvoker(call.call, args, this);
      return result as V;
    }

    this.reportError(`Invalid DynamicValue format: ${JSON.stringify(value)}`);
    return undefined as unknown as V;
  }

  /**
   * Subscribes to changes in a DynamicValue.
   * Returns a Subscription object that provides the current value and allows listening for updates.
   */
  subscribeDynamicValue<V>(
    value: DynamicValue,
    onChange: (value: V | undefined) => void,
  ): DataSubscription<V> {
    let initialValue: V | undefined;
    let isSync = true;

    const observable = this.toObservable<V>(value);
    const sub = observable.subscribe((val) => {
      if (isSync) {
        initialValue = val;
      } else {
        onChange(val);
      }
    });
    isSync = false;

    return {
      value: initialValue as unknown as V,
      unsubscribe: () => sub.unsubscribe(),
    };
  }

  private toObservable<V>(value: DynamicValue): Observable<V> {
    // 1. Literal
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return of(value as V);
    }

    // 2. Path Check
    if ("path" in value) {
      const absolutePath = this.resolvePath((value as DataBinding).path);
      // Create an observable from the data model subscription
      return new Observable<V>((subscriber) => {
        const sub = this.dataModel.subscribe<V>(absolutePath, (val) => {
          subscriber.next(val as V);
        });
        // Emit initial value immediately
        subscriber.next(this.dataModel.get(absolutePath));
        return () => sub.unsubscribe();
      });
    }

    // 3. Function Call
    if ("call" in value) {
      const call = value as FunctionCall;
      const argObservables: Record<string, Observable<any>> = {};

      for (const [key, argVal] of Object.entries(call.args)) {
        argObservables[key] = this.toObservable(argVal);
      }

      // If no args, just call directly
      if (Object.keys(argObservables).length === 0) {
        return this.evaluateFunctionReactive(call.call, {});
      }

      return combineLatest(argObservables).pipe(
        switchMap((args) => this.evaluateFunctionReactive<V>(call.call, args)),
      );
    }

    return of(value as V);
  }

  private evaluateFunctionReactive<V>(
    name: string,
    args: Record<string, any>,
  ): Observable<V> {
    if (!this.functionInvoker) {
      console.warn(`Function not found: ${name}`);
      return of(null as unknown as V);
    }
    const result = this.functionInvoker(name, args, this);

    if (isObservable(result)) {
      return result as Observable<V>;
    }
    return of(result as V);
  }

  /**
   * Creates a nested data context at the given relative path.
   *
   * @param relativePath The path relative to the current context.
   */
  nested(relativePath: string): DataContext {
    const newPath = this.resolvePath(relativePath);
    return new DataContext(this.dataModel, newPath, this.functionInvoker);
  }

  private resolvePath(path: string): string {
    // Absolute path - no resolution required.
    if (path.startsWith("/")) {
      return path;
    }
    // Handle specific cases like '.' or empty
    if (path === "" || path === ".") {
      return this.path;
    }

    // Normalize current path (remove trailing slash if exists, unless root)
    let base = this.path;
    if (base.endsWith("/") && base.length > 1) {
      base = base.slice(0, -1);
    }
    if (base === "/") base = "";

    return `${base}/${path}`;
  }
}
