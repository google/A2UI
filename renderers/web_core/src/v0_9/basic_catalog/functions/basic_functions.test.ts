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

import { describe, it } from "node:test";
import * as assert from "node:assert";
import { effect } from "@preact/signals-core";
import { BASIC_FUNCTIONS } from "./basic_functions.js";
import { DataModel } from "../../state/data-model.js";
import { DataContext } from "../../rendering/data-context.js";

function invoke(name: string, args: Record<string, any>, context: DataContext) {
  const fn = BASIC_FUNCTIONS.find(f => f.name === name);
  if (!fn) throw new Error(`Function ${name} not found`);
  return fn.execute(fn.schema.parse(args), context);
}

describe("BASIC_FUNCTIONS", () => {
  const dataModel = new DataModel({ a: 10, b: 20 });
  const context = new DataContext(dataModel, "/", () => null);

  describe("Arithmetic", () => {
    it("add", () => {
      assert.strictEqual(invoke("add", { a: 1, b: 2 }, context), 3);
      assert.strictEqual(invoke("add", { a: "1", b: "2" }, context), 3);
    });
    it("subtract", () => {
      assert.strictEqual(invoke("subtract", { a: 5, b: 3 }, context), 2);
    });
    it("multiply", () => {
      assert.strictEqual(invoke("multiply", { a: 4, b: 2 }, context), 8);
    });
    it("divide", () => {
      assert.strictEqual(invoke("divide", { a: 10, b: 2 }, context), 5);
      assert.strictEqual(
        invoke("divide", { a: 10, b: 0 }, context),
        Infinity,
      );
      assert.ok(
        Number.isNaN(invoke("divide", { a: 10, b: undefined }, context)),
      );
      assert.ok(
        Number.isNaN(invoke("divide", { a: undefined, b: 10 }, context)),
      );
      assert.ok(
        Number.isNaN(
          invoke("divide", { a: undefined, b: undefined }, context),
        ),
      );
      assert.ok(
        Number.isNaN(invoke("divide", { a: 10, b: null }, context)),
      );
      assert.ok(
        Number.isNaN(invoke("divide", { a: 10, b: "invalid" }, context)),
      );
      assert.strictEqual(invoke("divide", { a: 10, b: "2" }, context), 5);
      assert.strictEqual(
        invoke("divide", { a: "10", b: "2" }, context),
        5,
      );
    });
  });

  describe("Comparison", () => {
    it("equals", () => {
      assert.strictEqual(invoke("equals", { a: 1, b: 1 }, context), true);
      assert.strictEqual(
        invoke("equals", { a: 1, b: 2 }, context),
        false,
      );
    });
    it("not_equals", () => {
      assert.strictEqual(
        invoke("not_equals", { a: 1, b: 2 }, context),
        true,
      );
    });
    it("greater_than", () => {
      assert.strictEqual(
        invoke("greater_than", { a: 5, b: 3 }, context),
        true,
      );
      assert.strictEqual(
        invoke("greater_than", { a: 3, b: 5 }, context),
        false,
      );
    });
    it("less_than", () => {
      assert.strictEqual(
        invoke("less_than", { a: 3, b: 5 }, context),
        true,
      );
    });
  });

  describe("Logical", () => {
    it("and", () => {
      // Checks args['values'] array OR args['a'] && args['b'].
      assert.strictEqual(
        invoke("and", { values: [true, true] }, context),
        true,
      );
      assert.strictEqual(
        invoke("and", { values: [true, false] }, context),
        false,
      );
      assert.strictEqual(
        invoke("and", { a: true, b: true }, context),
        true,
      );
    });
    it("or", () => {
      assert.strictEqual(
        invoke("or", { values: [false, true] }, context),
        true,
      );
      assert.strictEqual(
        invoke("or", { values: [false, false] }, context),
        false,
      );
      assert.strictEqual(
        invoke("or", { a: false, b: true }, context),
        true,
      );
    });
    it("not", () => {
      assert.strictEqual(invoke("not", { value: false }, context), true);
      assert.strictEqual(invoke("not", { value: true }, context), false);
    });
  });

  describe("String", () => {
    it("contains", () => {
      assert.strictEqual(
        invoke("contains", 
          { string: "hello world", substring: "world" },
          context,
        ),
        true,
      );
      assert.strictEqual(
        invoke("contains", 
          { string: "hello world", substring: "foo" },
          context,
        ),
        false,
      );
    });
    it("starts_with", () => {
      assert.strictEqual(
        invoke("starts_with", { string: "hello", prefix: "he" }, context),
        true,
      );
    });
    it("ends_with", () => {
      assert.strictEqual(
        invoke("ends_with", { string: "hello", suffix: "lo" }, context),
        true,
      );
    });
  });

  describe("Validation", () => {
    it("required", () => {
      assert.strictEqual(
        invoke("required", { value: "a" }, context),
        true,
      );
      assert.strictEqual(
        invoke("required", { value: "" }, context),
        false,
      );
      assert.strictEqual(
        invoke("required", { value: null }, context),
        false,
      );
    });

    it("length", () => {
      assert.strictEqual(
        invoke("length", { value: "abc", min: 2 }, context),
        true,
      );
      assert.strictEqual(
        invoke("length", { value: "abc", max: 2 }, context),
        false,
      );
    });

    it("numeric", () => {
      assert.strictEqual(
        invoke("numeric", { value: 10, min: 5, max: 15 }, context),
        true,
      );
      assert.strictEqual(
        invoke("numeric", { value: 3, min: 5 }, context),
        false,
      );
    });

    it("email", () => {
      assert.strictEqual(
        invoke("email", { value: "test@example.com" }, context),
        true,
      );
      assert.strictEqual(
        invoke("email", { value: "invalid" }, context),
        false,
      );
    });

    it("regex", () => {
      assert.strictEqual(
        invoke("regex", { value: "abc", pattern: "^[a-z]+$" }, context),
        true,
      );
      assert.strictEqual(
        invoke("regex", { value: "123", pattern: "^[a-z]+$" }, context),
        false,
      );
    });

    it("regex handles invalid pattern", () => {
      assert.strictEqual(
        invoke("regex", { value: "abc", pattern: "[" }, context),
        false, // fallback when regex throws
      );
    });
  });

  describe("Formatting", () => {
    it("formatString (static literal)", (_, done) => {
      const result = invoke("formatString", 
        { value: "hello world" },
        context,
      ) as import("@preact/signals-core").Signal<string>;

      let cleanup: (() => void) | undefined;
      cleanup = effect(() => {
        const val = result.value;
        if (val) {
          assert.strictEqual(val, "hello world");
          if (cleanup) cleanup();
          done();
        }
      });
    });

    it("formatString (with data binding)", (_, done) => {
      // Assuming dataModel has { "a": 10 } from setup
      const result = invoke("formatString", 
        { value: "Value: ${a}" },
        context,
      ) as import("@preact/signals-core").Signal<string>;

      let emitCount = 0;
      let cleanup: (() => void) | undefined;
      cleanup = effect(() => {
        const val = result.value;
        try {
          if (emitCount === 0) {
            assert.strictEqual(val, "Value: 10");
            emitCount++;
            // Trigger a change in the next tick to avoid uninitialized sub
            setTimeout(() => {
              dataModel.set("/a", 42);
            }, 0);
          } else if (emitCount === 1) {
            assert.strictEqual(val, "Value: 42");
            emitCount++;
            if (cleanup) cleanup();
            done();
          }
        } catch (e) {
          if (cleanup) cleanup();
          done(e);
        }
      });
    });

    it("formatString (with function call)", (_, done) => {
      // Need a functionInvoker for function calls
      const ctxWithInvoker = new DataContext(dataModel, "/", (name, args) => {
        if (name === "add") {
          return Number(args["a"]) + Number(args["b"]);
        }
        return null;
      });

      const result = invoke("formatString", 
        { value: "Result: ${add(a: 5, b: 7)}" },
        ctxWithInvoker,
      ) as import("@preact/signals-core").Signal<string>;

      let cleanup: (() => void) | undefined;
      cleanup = effect(() => {
        const val = result.value;
        if (val) {
          assert.strictEqual(val, "Result: 12");
          if (cleanup) cleanup();
          done();
        }
      });
    });

    it("formatNumber", () => {
      // Test basic output as Intl behavior varies by environment.
      const result = invoke("formatNumber", 
        { value: 1234.56, decimals: 1 },
        context,
      );
      assert.ok(typeof result === "string");
      assert.ok(
        result.includes("1,234.6") ||
          result.includes("1234.6") ||
          result.includes("1 234,6"),
      );
    });

    it("formatCurrency", () => {
      const result = invoke("formatCurrency", 
        { value: 1234.56, currency: "USD" },
        context,
      );
      assert.ok(typeof result === "string");
      assert.ok(result.includes("1,234.56") || result.includes("1234.56"));
      assert.ok(result.includes("$") || result.includes("USD"));
    });

    it("formatDate", () => {
      const result = invoke("formatDate", 
        { value: "2025-01-01T00:00:00Z" },
        context,
      );
      assert.ok(typeof result === "string");
      assert.ok(result.length > 0);

      const resultISO = invoke("formatDate", 
        { value: "2025-01-01T00:00:00Z", format: "ISO" },
        context,
      );
      assert.strictEqual(resultISO, "2025-01-01T00:00:00.000Z");
    });

    it("formatDate handles invalid dates", () => {
      const result = invoke("formatDate", 
        { value: "invalid-date" },
        context,
      );
      assert.strictEqual(result, "");
    });

    it("formatDate uses options properly", () => {
      const result = invoke("formatDate", 
        {
          value: "2025-01-01T00:00:00Z",
          options: { year: "numeric", timeZone: "UTC" },
        },
        context,
      );
      assert.ok(typeof result === "string");
      assert.ok(result.includes("2025"), `Result was: ${result}`);
    });

    it("formatDate fallback on formatting error", () => {
      const result = invoke("formatDate", 
        { value: "2025-01-01T00:00:00Z", locale: "invalid-locale-!!!11123" },
        context,
      );
      // It should fallback to .toISOString() which starts with 2025
      assert.ok(typeof result === "string" && result.includes("2025"));
    });

    it("formatCurrency fallback on formatting error", () => {
      const result = invoke("formatCurrency", 
        { value: 1234.56, currency: "INVALID-CURRENCY", decimals: 2 },
        context,
      );
      // Fallbacks to toFixed
      assert.strictEqual(result, "1234.56");
    });

    it("pluralize", () => {
      assert.strictEqual(
        invoke("pluralize", 
          { value: 1, one: "apple", other: "apples" },
          context,
        ),
        "apple",
      );
      assert.strictEqual(
        invoke("pluralize", 
          { value: 2, one: "apple", other: "apples" },
          context,
        ),
        "apples",
      );
    });
  });

  describe("Actions", () => {
    it("openUrl", () => {
      // Set up mock window object
      const originalWindow = (global as any).window;
      let openedUrl = "";
      (global as any).window = {
        open: (url: string) => {
          openedUrl = url;
        },
      };

      try {
        invoke("openUrl", { url: "https://google.com" }, context);
        assert.strictEqual(openedUrl, "https://google.com");
      } finally {
        (global as any).window = originalWindow;
      }
    });
  });
});