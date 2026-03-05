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
import { switchMap } from "rxjs/operators";
import { DataModel, DataSubscription } from "../state/data-model.js";
import type {
  DynamicValue,
  DataBinding,
  FunctionCall,
} from "../schema/common-types.js";
import { A2uiExpressionError } from "../errors.js";

/** A function that invokes a catalog function by name and returns its result synchronously or as an Observable. */
export type FunctionInvoker = (
  name: string,
  args: Record<string, any>,
  context: DataContext,
) => any;

/**
 * A contextual view of the main DataModel, serving as the unified interface for resolving
 * DynamicValues (literals, data paths, function calls) within a specific scope.
 *
 * Components use `DataContext` instead of interacting with the `DataModel` directly.
 * It automatically handles resolving relative paths against the component's current scope
 * and provides tools for evaluating complex, reactive expressions.
 */
export class DataContext {
  /**
   * Initializes a new DataContext.
   *
   * @param dataModel The shared, global DataModel instance for the entire UI surface.
   * @param path The absolute path in the DataModel that this context is scoped to (its "current working directory").
   * @param functionInvoker An optional callback for executing function calls defined in the A2UI component tree against a UI catalog.
   */
  constructor(
    readonly dataModel: DataModel,
    readonly path: string,
    readonly functionInvoker?: FunctionInvoker,
  ) {}

  /**
   * Mutates the underlying DataModel at the specified path.
   *
   * This is the primary method for components to push state changes (e.g. user input)
   * back up to the global model.
   *
   * @param path A JSON pointer path. If relative, it is resolved against this context's `path`.
   * @param value The new value to store in the DataModel.
   */
  set(path: string, value: any): void {
    const absolutePath = this.resolvePath(path);
    this.dataModel.set(absolutePath, value);
  }

  /**
   * Synchronously evaluates a `DynamicValue` (a literal, a path binding, or a function call)
   * into its concrete runtime value.
   *
   * **Note:** This method evaluates the value *once* at the current moment in time.
   * It does not create any reactive subscriptions. If the underlying data changes later,
   * this result will not automatically update. Use `subscribeDynamicValue` for reactive updates.
   *
   * @param value The DynamicValue object from the A2UI JSON payload.
   * @returns The synchronously resolved value.
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
        throw new A2uiExpressionError(
          `Failed to resolve dynamic value: Function invoker is not configured for call '${call.call}'.`,
        );
      }

      const result = this.functionInvoker(call.call, args, this);
      return result as V;
    }

    throw new A2uiExpressionError(
      `Invalid DynamicValue format: ${JSON.stringify(value)}`,
    );
  }

  /**
   * Reactively listens to changes in a `DynamicValue`.
   *
   * This is the core reactive binding mechanism. Whenever the underlying data changes
   * (or if a function call's dependencies change), the `onChange` callback will be fired
   * with the freshly evaluated result.
   *
   * @template V The expected type of the resolved value.
   * @param value The DynamicValue to evaluate and observe.
   * @param onChange A callback fired whenever the evaluated result changes.
   * @returns A `DataSubscription` containing the initial synchronously-resolved value, along with an `unsubscribe` method to clean up the listener.
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
      throw new A2uiExpressionError(
        `Failed to resolve dynamic value: Function invoker is not configured for call '${name}'.`,
      );
    }
    const result = this.functionInvoker(name, args, this);

    if (isObservable(result)) {
      return result as Observable<V>;
    }
    return of(result as V);
  }

  /**
   * Creates a new, child `DataContext` scoped to a deeper path.
   *
   * This is used when a component (like a List or a Card) wants to provide a targeted
   * data scope for its children, so children can use relative paths like `./title`.
   *
   * @param relativePath The path relative to the *current* context's path.
   * @returns A new `DataContext` instance pointing to the resolved absolute path.
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
