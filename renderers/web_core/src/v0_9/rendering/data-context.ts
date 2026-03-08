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

import { signal, computed, Signal, effect } from "@preact/signals-core";
import { DataModel, DataSubscription } from "../state/data-model.js";
import type {
  DynamicValue,
  DataBinding,
  FunctionCall,
} from "../schema/common-types.js";
import { A2uiExpressionError } from "../errors.js";

/** A function that invokes a catalog function by name and returns its result synchronously or as a Signal. */
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
  /**
   * Initializes a new DataContext.
   */
  constructor(
    readonly dataModel: DataModel,
    readonly path: string,
    readonly functionInvoker?: FunctionInvoker,
  ) {}

  /**
   * Mutates the underlying DataModel at the specified path.
   */
  set(path: string, value: any): void {
    const absolutePath = this.resolvePath(path);
    this.dataModel.set(absolutePath, value);
  }

  /**
   * Synchronously evaluates a `DynamicValue` into its concrete runtime value.
   */
  resolveDynamicValue<V>(value: DynamicValue): V {
    // 1. Literal Check
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
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

      for (const [key, argVal] of Object.entries(call.args)) {
        args[key] = this.resolveDynamicValue(argVal);
      }

      if (!this.functionInvoker) {
        throw new A2uiExpressionError(
          `Failed to resolve dynamic value: Function invoker is not configured for call '${call.call}'.`,
        );
      }

      const result = this.functionInvoker(call.call, args, this);
      return (result instanceof Signal ? result.peek() : result) as V;
    }

    throw new A2uiExpressionError(
      `Invalid DynamicValue format: ${JSON.stringify(value)}`,
    );
  }

  /**
   * Reactively listens to changes in a `DynamicValue`.
   */
  subscribeDynamicValue<V>(
    value: DynamicValue,
    onChange: (value: V | undefined) => void,
  ): DataSubscription<V> {
    const sig = this.resolveSignal<V>(value);
    
    let isSync = true;
    let currentValue = sig.peek();

    const dispose = effect(() => {
      const val = sig.value;
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
      unsubscribe: () => dispose(),
    };
  }

  /**
   * Returns a Preact Signal representing the reactive dynamic value.
   */
  resolveSignal<V>(value: DynamicValue): Signal<V> {
    // 1. Literal
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return signal(value as V);
    }

    // 2. Path Check
    if ("path" in value) {
      const absolutePath = this.resolvePath((value as DataBinding).path);
      return this.dataModel.getSignal<V>(absolutePath) as Signal<V>;
    }

    // 3. Function Call
    if ("call" in value) {
      const call = value as FunctionCall;
      const argSignals: Record<string, Signal<any>> = {};

      for (const [key, argVal] of Object.entries(call.args)) {
        argSignals[key] = this.resolveSignal(argVal);
      }

      if (Object.keys(argSignals).length === 0) {
        const result = this.evaluateFunctionReactive<V>(call.call, {});
        return result instanceof Signal ? result : signal(result);
      }

      const keys = Object.keys(argSignals);
      
      return computed(() => {
        const argsRecord: Record<string, any> = {};
        for (let i = 0; i < keys.length; i++) {
          argsRecord[keys[i]] = argSignals[keys[i]].value;
        }
        
        const result = this.evaluateFunctionReactive<V>(call.call, argsRecord);
        // Track inner signal if the function returns one
        return result instanceof Signal ? result.value : result;
      });
    }

    return signal(value as unknown as V);
  }

  private evaluateFunctionReactive<V>(
    name: string,
    args: Record<string, any>,
  ): Signal<V> | V {
    if (!this.functionInvoker) {
      throw new A2uiExpressionError(
        `Failed to resolve dynamic value: Function invoker is not configured for call '${name}'.`,
      );
    }
    return this.functionInvoker(name, args, this);
  }

  /**
   * Creates a new, child `DataContext` scoped to a deeper path.
   */
  nested(relativePath: string): DataContext {
    const newPath = this.resolvePath(relativePath);
    return new DataContext(this.dataModel, newPath, this.functionInvoker);
  }

  private resolvePath(path: string): string {
    if (path.startsWith("/")) {
      return path;
    }
    if (path === "" || path === ".") {
      return this.path;
    }

    let base = this.path;
    if (base.endsWith("/") && base.length > 1) {
      base = base.slice(0, -1);
    }
    if (base === "/") base = "";

    return `${base}/${path}`;
  }
}
