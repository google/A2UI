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

import {z} from 'zod';
import {DataModel, DataSubscription} from '../state/data-model.js';
import type {
  DynamicValue,
  DataBinding,
  FunctionCall,
  Action,
} from '../schema/common-types.js';
import {A2uiExpressionError} from '../errors.js';
import {isSignal} from '../catalog/types.js';
import {FunctionInvoker} from '../catalog/function_invoker.js';
import {SurfaceModel} from '../state/surface-model.js';
import {FrameworkSignal, SignalKinds} from '../reactivity/signals.js';

/**
 * A contextual view of the main DataModel, serving as the unified interface for resolving
 * DynamicValues (literals, data paths, function calls) within a specific scope.
 *
 * Components use `DataContext` instead of interacting with the `DataModel` directly.
 * It automatically handles resolving relative paths against the component's current scope
 * and provides tools for evaluating complex, reactive expressions.
 */
export class DataContext<SK extends keyof SignalKinds<any>> {
  /** The shared, global DataModel instance for the entire UI surface. */
  readonly dataModel: DataModel<SK>;
  /** A callback for executing function calls defined in the A2UI component tree. */
  readonly functionInvoker: FunctionInvoker<SK>;

  private readonly signalCleanups = new WeakMap<any, () => void>();

  /**
   * Initializes a new DataContext.
   *
   * @param surface The surface model this context belongs to.
   * @param frameworkSignal The framework signal implementation to use for reactive values.
   * @param path The absolute path in the DataModel that this context is scoped to (its "current working directory").
   */
  constructor(
    readonly surface: SurfaceModel<any, SK>,
    readonly frameworkSignal: FrameworkSignal<SK>,
    readonly path: string,
  ) {
    this.dataModel = surface.dataModel;
    this.functionInvoker = surface.catalog.invoker;
  }

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
    // 1. Literal check (excluding arrays and objects)
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return value as V;
    }

    // 2. Path Check: { path: "..." }
    if ('path' in value) {
      const absolutePath = this.resolvePath((value as DataBinding).path);
      return this.dataModel.get(absolutePath);
    }

    // 3. Function Call: { call: "...", args: ... }
    if ('call' in value) {
      const call = value as FunctionCall;
      const args: Record<string, any> = {};

      for (const [key, argVal] of Object.entries(call.args)) {
        args[key] = this.resolveDynamicValue(argVal);
      }

      const abortController = new AbortController();

      const result = this.evaluateFunctionReactive<V>(
        call.call,
        args,
        abortController.signal,
      );

      if (result === undefined) {
        return undefined as any;
      }

      return (isSignal(result) ? result.peek() : result) as V;
    }

    return value as V;
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
    const sig = this.resolveSignal<V>(value);

    let isSync = true;
    let currentValue = this.frameworkSignal.unwrap(sig);

    const destroy = this.frameworkSignal.effect(() => {
      const val = this.frameworkSignal.unwrap(sig);
      currentValue = val;
      if (!isSync) {
        onChange(val);
      }
    });
    isSync = false;

    return {
      get value() {
        return currentValue;
      },
      unsubscribe: () => {
        destroy();
        const cleanup = this.signalCleanups.get(sig);
        if (cleanup) cleanup();
      },
    };
  }

  /**
   * Returns a Signal representing the reactive dynamic value.
   *
   * This method recursively resolves any nested path bindings or function calls into a
   * single, reactive `Signal`. Any changes to the underlying data or function dependencies
   * will cause this signal's value to update.
   *
   * @param value The DynamicValue to evaluate and observe.
   * @returns A signal containing the reactive result of the evaluation.
   */
  resolveSignal<V>(value: DynamicValue): SignalKinds<V | undefined>[SK] {
    // 1. Literal
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return this.frameworkSignal.wrap(value as V);
    }

    // 2. Path Check
    if ('path' in value) {
      const absolutePath = this.resolvePath(value.path);
      return this.dataModel.getSignal<V>(absolutePath);
    }

    // 3. Function Call
    if ('call' in value) {
      const call = value as FunctionCall;
      // NOTE: argSignals seem to be totally unused in terms of reactivity and
      //       they don't actually get updated again after becoming signals.
      const argSignals: Record<string, SignalKinds<V | undefined>[SK]> = {};

      for (const [key, argVal] of Object.entries(call.args)) {
        argSignals[key] = this.resolveSignal(argVal);
      }

      if (Object.keys(argSignals).length === 0) {
        const abortController = new AbortController();
        const result = this.evaluateFunctionReactive<V>(
          call.call,
          {},
          abortController.signal,
        );
        return this.frameworkSignal.isSignal(result)
          ? result
          : this.frameworkSignal.wrap(result);
      }

      const keys = Object.keys(argSignals);
      const resultSig = this.frameworkSignal.wrap<V | undefined>(undefined);
      let abortController: AbortController | undefined;
      let innerUnsubscribe: (() => void) | undefined;

      const argsSig = this.frameworkSignal.computed(() => {
        const argsRecord: Record<string, any> = {};
        for (let i = 0; i < keys.length; i++) {
          argsRecord[keys[i]] = this.frameworkSignal.unwrap(
            argSignals[keys[i]],
          );
        }
        return argsRecord;
      });

      const destroy = this.frameworkSignal.effect(() => {
        try {
          const args =
            this.frameworkSignal.unwrap<Record<string, any>>(argsSig);
          if (abortController) abortController.abort();
          if (innerUnsubscribe) {
            innerUnsubscribe();
            innerUnsubscribe = undefined;
          }
          abortController = new AbortController();

          // Run the function once. The result may be a signal.
          const res = this.evaluateFunctionReactive<V>(
            call.call,
            args,
            abortController.signal,
          );

          if (this.frameworkSignal.isSignal(res)) {
            innerUnsubscribe = this.frameworkSignal.effect(() => {
              this.frameworkSignal.set(
                resultSig,
                this.frameworkSignal.unwrap<V>(res),
              );
            });
          } else {
            this.frameworkSignal.set(resultSig, res);
          }
        } catch (e: any) {
          this.dispatchExpressionError(e, call.call);
          // In reactive mode, we should not throw. Instead, reset the signal value.
          this.frameworkSignal.set(resultSig, undefined);
        }

        return () => {
          if (innerUnsubscribe) innerUnsubscribe();
          if (abortController) abortController.abort();
        };
      });

      this.signalCleanups.set(resultSig, () => {
        destroy();
        for (const key of Object.keys(argSignals)) {
          const childCleanup = this.signalCleanups.get(argSignals[key]);
          if (childCleanup) childCleanup();
        }
      });

      return resultSig;
    }

    return this.frameworkSignal.wrap(value);
  }

  /**
   * Resolves an action by evaluating its top-level dynamic values.
   *
   * For event actions, it resolves each value in the context map.
   * For function call actions, it evaluates the call.
   *
   * This is non-recursive: it only resolves one level deep for the context record,
   * in accordance with the schema specification that requires values to be single
   * DynamicValue types and prevents arbitrary nesting.
   */
  resolveAction(action: Action): any {
    if ('event' in action) {
      const resolvedContext: Record<string, any> = {};
      if (action.event.context) {
        for (const [key, value] of Object.entries(action.event.context)) {
          resolvedContext[key] = this.resolveDynamicValue(value);
        }
      }
      return {
        event: {
          ...action.event,
          context: resolvedContext,
        },
      };
    }
    if ('functionCall' in action) {
      return this.resolveDynamicValue(action.functionCall);
    }
    return action;
  }

  private evaluateFunctionReactive<V>(
    name: string,
    args: Record<string, any>,
    abortSignal?: AbortSignal,
  ): SignalKinds<V>[SK] | V | undefined {
    try {
      return this.functionInvoker(name, args, this, abortSignal);
    } catch (e: any) {
      this.dispatchExpressionError(e, name);
      return undefined;
    }
  }

  private dispatchExpressionError(e: any, name: string): void {
    if (e?.name === 'ZodError' || e instanceof z.ZodError) {
      const err = new A2uiExpressionError(
        `Validation failed for function '${name}': ${e.message}`,
        name,
        e.errors ?? e.issues,
      );
      this.surface.dispatchError({
        code: 'EXPRESSION_ERROR',
        message: err.message,
        expression: name,
        details: err.details,
      });
    } else if (e instanceof A2uiExpressionError) {
      this.surface.dispatchError({
        code: 'EXPRESSION_ERROR',
        message: e.message,
        expression: e.expression,
        details: e.details,
      });
    } else {
      this.surface.dispatchError({
        code: 'EXPRESSION_ERROR',
        message:
          e.message ?? `An unexpected error occurred in function ${name}.`,
        expression: name,
        details: {stack: e.stack},
      });
    }
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
  nested(relativePath: string): DataContext<SK> {
    const newPath = this.resolvePath(relativePath);
    return new DataContext(this.surface, this.frameworkSignal, newPath);
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    if (path === '' || path === '.') {
      return this.path;
    }

    let base = this.path;
    if (base.endsWith('/') && base.length > 1) {
      base = base.slice(0, -1);
    }
    if (base === '/') base = '';

    return `${base}/${path}`;
  }
}
