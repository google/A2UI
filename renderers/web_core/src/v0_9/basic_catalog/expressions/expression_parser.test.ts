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
import { ExpressionParser } from "./expression_parser.js";
import {
  ExpressionEvaluator,
  EvaluationContext,
} from "./expression_evaluator.js";
import { DataModel } from "../../state/data-model.js";
import { DataContext } from "../../rendering/data-context.js";
import { Observable, of } from "rxjs";

class MockEvaluator extends ExpressionEvaluator {
  evaluate(
    expr: { call: string; args: Record<string, unknown> },
    _context: EvaluationContext,
  ): any {
    if (expr.call === "add") {
      return (Number(expr.args["a"]) || 0) + (Number(expr.args["b"]) || 0);
    }
    if (expr.call === "upper") {
      return String(expr.args["text"] || "").toUpperCase();
    }
    return null;
  }
}

describe("ExpressionParser", () => {
  let parser: ExpressionParser;
  let context: DataContext;
  let evaluator: MockEvaluator;

  beforeEach(() => {
    const dataModel = new DataModel({
      foo: "bar",
      num: 42,
      nested: "foo",
    });
    // @ts-ignore
    evaluator = new MockEvaluator();
    context = new DataContext(dataModel, "/", (name, args) =>
      evaluator.evaluate({ call: name, args }, context),
    );
    parser = new ExpressionParser(context, evaluator);
  });

  it("parses literal strings unchanged", (_t, done) => {
    parser.parse("hello world").subscribe((result) => {
      assert.strictEqual(result, "hello world");
      done();
    });
  });

  it("parses simple interpolation", (_t, done) => {
    parser.parse("hello ${foo}").subscribe((result) => {
      assert.strictEqual(result, "hello bar");
      done();
    });
  });

  it("parses number interpolation", (_t, done) => {
    parser.parse("number is ${num}").subscribe((result) => {
      assert.strictEqual(result, "number is 42");
      done();
    });
  });

  it("parses nested interpolation", (_t, done) => {
    parser.parse("val is ${${nested}}").subscribe((result) => {
      assert.strictEqual(result, "val is foo");
      done();
    });
  });

  it("handles escaped interpolation", (_t, done) => {
    parser.parse("escaped \\${foo}").subscribe((result) => {
      assert.strictEqual(result, "escaped ${foo}");
      done();
    });
  });

  it("parses function calls", (_t, done) => {
    parser.parse("sum is ${add(a: 10, b: 20)}").subscribe((result) => {
      assert.strictEqual(result, "sum is 30");
      done();
    });
  });

  it("parses function calls with string literals", (_t, done) => {
    parser.parse('case is ${upper(text: "hello")}').subscribe((result) => {
      assert.strictEqual(result, "case is HELLO");
      done();
    });
  });

  it("parses keywords", (_t, done) => {
    parser.parse("${true} ${false} ${null}").subscribe((result) => {
      assert.strictEqual(result, "true false "); // null becomes empty string in map
      done();
    });
  });

  it("returns error on max depth exceeded", (_t, done) => {
    parser.parse("depth", 11).subscribe({
      next: () => {
        assert.fail("Should have returned an error");
      },
      error: (err) => {
        assert.match(err.message, /Max recursion depth reached/);
        done();
      },
    });
  });

  it("handles deep recursion gracefully", (_t, done) => {
    parser.parse('${${"hello"}}').subscribe((result) => {
      assert.strictEqual(result, "hello");
      done();
    });
  });

  it("returns error on unclosed interpolation", (_t, done) => {
    parser.parse("hello ${world").subscribe({
      next: () => {
        assert.fail("Should have returned an error");
      },
      error: (err) => {
        assert.match(err.message, /Unclosed interpolation/);
        done();
      },
    });
  });

  it("returns error on invalid function syntax", (_t, done) => {
    // Missing closing parenthesis
    parser.parse("${add(a: 1, b: 2}").subscribe({
      next: () => {
        assert.fail("Should have returned an error");
      },
      error: (err) => {
        assert.match(err.message, /Expected '\)'/);
        done();
      },
    });
  });

  it("returns error on unexpected characters at end", (_t, done) => {
    // Extra garbage after valid expression inside interpolation
    parser.parse("${true false}").subscribe({
      next: () => {
        assert.fail("Should have returned an error");
      },
      error: (err) => {
        assert.match(err.message, /Unexpected characters/);
        done();
      },
    });
  });
});
