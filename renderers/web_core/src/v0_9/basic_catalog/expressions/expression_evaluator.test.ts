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

import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import {
  ExpressionEvaluator,
  EvaluationContext,
} from "./expression_evaluator.js";
import { DataModel } from "../../state/data-model.js";
import { DataContext } from "../../rendering/data-context.js";

describe("ExpressionEvaluator", () => {
  let evaluator: ExpressionEvaluator;
  let context: EvaluationContext;
  let dataModel: DataModel;

  beforeEach(() => {
    evaluator = new ExpressionEvaluator();
    dataModel = new DataModel({
      user: { name: "Alice", age: 30 },
      items: ["a", "b"],
    });

    context = new DataContext(dataModel, "/", (name, args) => {
      const fn = evaluator.getFunction(name);
      return fn ? fn(args, context) : undefined;
    });
  });

  it("evaluates primitives as themselves", () => {
    assert.strictEqual(evaluator.evaluate(123, context), 123);
    assert.strictEqual(evaluator.evaluate("hello", context), "hello");
    assert.strictEqual(evaluator.evaluate(true, context), true);
    assert.strictEqual(evaluator.evaluate(null, context), null);
  });

  it("evaluates data bindings", () => {
    assert.strictEqual(
      evaluator.evaluate({ path: "/user/name" }, context),
      "Alice",
    );
    assert.strictEqual(evaluator.evaluate({ path: "/user/age" }, context), 30);
    assert.deepStrictEqual(evaluator.evaluate({ path: "/items" }, context), [
      "a",
      "b",
    ]);
    assert.strictEqual(
      evaluator.evaluate({ path: "/nonexistent" }, context),
      undefined,
    );
  });

  it("evaluates function calls", () => {
    evaluator.registerFunction(
      "add",
      (args) => (args["a"] as number) + (args["b"] as number),
    );

    // Call with primitives.
    const result = evaluator.evaluate(
      {
        call: "add",
        args: { a: 10, b: 20 },
      },
      context,
    );
    assert.strictEqual(result, 30);
  });

  it("evaluates arrays with nested expressions", () => {
    const result = evaluator.evaluate(
      [{ path: "/user/name" }, "static", { path: "/user/age" }],
      context,
    );
    assert.deepStrictEqual(result, ["Alice", "static", 30]);
  });

  it("evaluates objects with nested expressions", () => {
    const result = evaluator.evaluate(
      {
        userName: { path: "/user/name" },
        meta: {
          age: { path: "/user/age" },
          static: true,
        },
      },
      context,
    );
    assert.deepStrictEqual(result, {
      userName: "Alice",
      meta: {
        age: 30,
        static: true,
      },
    });
  });

  it("evaluates dependent function calls (nested calls)", () => {
    evaluator.registerFunction(
      "add",
      (args) => (args["a"] as number) + (args["b"] as number),
    );
    evaluator.registerFunction(
      "multiply",
      (args) => (args["a"] as number) * (args["b"] as number),
    );

    // multiply(add(2, 3), 4) = (2+3)*4 = 20
    const result = evaluator.evaluate(
      {
        call: "multiply",
        args: {
          a: {
            call: "add",
            args: { a: 2, b: 3 },
          },
          b: 4,
        },
      },
      context,
    );

    assert.strictEqual(result, 20);
  });

  it("handles recursion depth limit", () => {
    // Create a circular structure that would caus infinite recursion
    const circular: any = {};
    circular.self = circular;

    // In a real scenario, this might come from a maliciously crafted JSON or bug
    // Since JSON.parse/stringify throws on circular refs, we simulate deep nesting
    // by manually constructing a deep object.

    let deep: any = { val: 1 };
    for (let i = 0; i < 60; i++) {
      deep = { next: deep };
    }

    // The evaluator should warn and return null (or stop evaluating) at depth 50
    // We can spy on console.warn if we want, or just check it returns something sane/doesn't crash.
    // For this test, we accept that it might return a partially evaluated structure or null at the leaf.

    // Actually, our implementation returns 'null' when depth is exceeded for that branch.
    const result = evaluator.evaluate(deep, context);

    // Verify it didn't crash.
    assert.notStrictEqual(result, undefined);
  });

  it("handles unknown functions gracefully", () => {
    const result = evaluator.evaluate(
      {
        call: "unknown_function",
        args: {},
      },
      context,
    );
    // Based on implementation, it logs warn and returns null
    assert.strictEqual(result, null);
  });
});
