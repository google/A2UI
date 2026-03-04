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

// Basic types for the catalog - these might need to be refined or imported from a shared types definition
/**
 * Types used by the expression evaluator.
 */
export namespace Types {
  export interface FunctionCall {
    call: string;
    args: Record<string, unknown>;
  }

  export interface DataBinding {
    path: string;
  }
}

export function isFunctionCall(value: unknown): value is Types.FunctionCall {
  return (
    typeof value === "object" &&
    value !== null &&
    "call" in value &&
    "args" in value &&
    typeof (value as any).call === "string" &&
    typeof (value as any).args === "object" &&
    (value as any).args !== null
  );
}

export function isDataBinding(value: unknown): value is Types.DataBinding {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof (value as any).path === "string"
  );
}

import { DataContext } from "../../rendering/data-context.js";

/**
 * A function implementation that can be registered with the evaluator.
 */
export type FunctionImplementation = (
  args: Record<string, unknown>,
  context: DataContext,
) => unknown;

/**
 * Interface for a custom parser.
 */
export interface Parser {
  parse(input: string): any;
}

/**
 * The context in which an expression is evaluated.
 */
export type EvaluationContext = DataContext;

/**
 * Evaluates expressions in a given context.
 * Supports function calls, data bindings, and primitive wrappers.
 */
export class ExpressionEvaluator {
  private functions = new Map<string, FunctionImplementation>();
  private maxRecursionDepth = 50;

  /**
   * Creates a new evaluator.
   *
   * @param functions Optional initial functions to register.
   */
  constructor(
    functions?:
      | Record<string, FunctionImplementation>
      | Record<string, FunctionImplementation>[],
  ) {
    if (functions) {
      if (Array.isArray(functions)) {
        for (const group of functions) {
          for (const [name, impl] of Object.entries(group)) {
            this.registerFunction(name, impl);
          }
        }
      } else {
        for (const [name, impl] of Object.entries(functions)) {
          this.registerFunction(name, impl);
        }
      }
    }
  }

  /**
   * Registers a function implementation.
   *
   * @param name The name of the function.
   * @param impl The implementation of the function.
   */
  registerFunction(name: string, impl: FunctionImplementation) {
    this.functions.set(name, impl);
  }

  /**
   * Retrieves a registered function by name.
   *
   * @param name The name of the function.
   */
  getFunction(name: string): FunctionImplementation | undefined {
    return this.functions.get(name);
  }

  /**
   * Evaluates an expression.
   *
   * @param expression The expression to evaluate.
   * @param context The context for evaluation.
   */
  evaluate(expression: unknown, context: EvaluationContext): unknown {
    return this.evaluateInternal(expression, context, 0);
  }

  private evaluateInternal(
    expression: unknown,
    context: EvaluationContext,
    depth: number,
  ): unknown {
    if (depth > this.maxRecursionDepth) {
      console.warn("Max recursion depth reached in ExpressionEvaluator");
      return null;
    }

    if (expression === null || expression === undefined) {
      return expression;
    }

    // Check if it's a FunctionCall
    if (isFunctionCall(expression)) {
      return this.evaluateFunctionCall(expression, context, depth + 1);
    }

    // Check if it's a DataBinding (v0.9)
    if (isDataBinding(expression)) {
      return context.resolveDynamicValue(expression as any);
    }

    if (Array.isArray(expression)) {
      return expression.map((item) =>
        this.evaluateInternal(item, context, depth + 1),
      );
    }

    if (typeof expression === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(expression)) {
        result[key] = this.evaluateInternal(value, context, depth + 1);
      }
      return result;
    }

    // Primitives return as is
    return expression;
  }

  private evaluateFunctionCall(
    call: Types.FunctionCall,
    context: EvaluationContext,
    depth: number,
  ): any {
    const fn = this.functions.get(call.call);
    if (!fn) {
      console.warn(`Function not found: ${call.call}`);
      return null;
    }

    // Evaluate args
    const resolvedArgs: Record<string, any> = {};
    for (const [key, value] of Object.entries(call.args)) {
      resolvedArgs[key] = this.evaluateInternal(value, context, depth + 1);
    }

    return fn(resolvedArgs, context);
  }
}
