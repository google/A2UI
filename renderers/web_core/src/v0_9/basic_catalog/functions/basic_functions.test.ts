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
import { BASIC_FUNCTIONS } from "./basic_functions.js";
import { DataModel } from "../../state/data-model.js";
import { DataContext } from "../../rendering/data-context.js";

describe("BASIC_FUNCTIONS", () => {
  const dataModel = new DataModel({ a: 10, b: 20 });
  const context = new DataContext(dataModel, "/");

  describe("Arithmetic", () => {
    it("add", () => {
      assert.strictEqual(BASIC_FUNCTIONS.add({ a: 1, b: 2 }, context), 3);
      assert.strictEqual(BASIC_FUNCTIONS.add({ a: "1", b: "2" }, context), 3);
    });
    it("subtract", () => {
      assert.strictEqual(BASIC_FUNCTIONS.subtract({ a: 5, b: 3 }, context), 2);
    });
    it("multiply", () => {
      assert.strictEqual(BASIC_FUNCTIONS.multiply({ a: 4, b: 2 }, context), 8);
    });
    it("divide", () => {
      assert.strictEqual(BASIC_FUNCTIONS.divide({ a: 10, b: 2 }, context), 5);
      assert.strictEqual(
        BASIC_FUNCTIONS.divide({ a: 10, b: 0 }, context),
        Infinity,
      );
      assert.ok(
        Number.isNaN(BASIC_FUNCTIONS.divide({ a: 10, b: undefined }, context)),
      );
      assert.ok(
        Number.isNaN(BASIC_FUNCTIONS.divide({ a: undefined, b: 10 }, context)),
      );
      assert.ok(
        Number.isNaN(
          BASIC_FUNCTIONS.divide({ a: undefined, b: undefined }, context),
        ),
      );
      assert.ok(
        Number.isNaN(BASIC_FUNCTIONS.divide({ a: 10, b: null }, context)),
      );
      assert.ok(
        Number.isNaN(BASIC_FUNCTIONS.divide({ a: 10, b: "invalid" }, context)),
      );
      assert.strictEqual(BASIC_FUNCTIONS.divide({ a: 10, b: "2" }, context), 5);
      assert.strictEqual(
        BASIC_FUNCTIONS.divide({ a: "10", b: "2" }, context),
        5,
      );
    });
  });

  describe("Comparison", () => {
    it("equals", () => {
      assert.strictEqual(BASIC_FUNCTIONS.equals({ a: 1, b: 1 }, context), true);
      assert.strictEqual(
        BASIC_FUNCTIONS.equals({ a: 1, b: 2 }, context),
        false,
      );
    });
    it("not_equals", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.not_equals({ a: 1, b: 2 }, context),
        true,
      );
    });
    it("greater_than", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.greater_than({ a: 5, b: 3 }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.greater_than({ a: 3, b: 5 }, context),
        false,
      );
    });
    it("less_than", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.less_than({ a: 3, b: 5 }, context),
        true,
      );
    });
  });

  describe("Logical", () => {
    it("and", () => {
      // Checks args['values'] array OR args['a'] && args['b'].
      assert.strictEqual(
        BASIC_FUNCTIONS.and({ values: [true, true] }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.and({ values: [true, false] }, context),
        false,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.and({ a: true, b: true }, context),
        true,
      );
    });
    it("or", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.or({ values: [false, true] }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.or({ values: [false, false] }, context),
        false,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.or({ a: false, b: true }, context),
        true,
      );
    });
    it("not", () => {
      assert.strictEqual(BASIC_FUNCTIONS.not({ value: false }, context), true);
      assert.strictEqual(BASIC_FUNCTIONS.not({ value: true }, context), false);
    });
  });

  describe("String", () => {
    it("contains", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.contains(
          { string: "hello world", substring: "world" },
          context,
        ),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.contains(
          { string: "hello world", substring: "foo" },
          context,
        ),
        false,
      );
    });
    it("starts_with", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.starts_with({ string: "hello", prefix: "he" }, context),
        true,
      );
    });
    it("ends_with", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.ends_with({ string: "hello", suffix: "lo" }, context),
        true,
      );
    });
  });

  describe("Validation", () => {
    it("required", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.required({ value: "a" }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.required({ value: "" }, context),
        false,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.required({ value: null }, context),
        false,
      );
    });

    it("length", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.length({ value: "abc", min: 2 }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.length({ value: "abc", max: 2 }, context),
        false,
      );
    });

    it("numeric", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.numeric({ value: 10, min: 5, max: 15 }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.numeric({ value: 3, min: 5 }, context),
        false,
      );
    });

    it("email", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.email({ value: "test@example.com" }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.email({ value: "invalid" }, context),
        false,
      );
    });

    it("regex", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.regex({ value: "abc", pattern: "^[a-z]+$" }, context),
        true,
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.regex({ value: "123", pattern: "^[a-z]+$" }, context),
        false,
      );
    });

    it("regex handles invalid pattern", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.regex({ value: "abc", pattern: "[" }, context),
        false, // fallback when regex throws
      );
    });
  });

  describe("Formatting", () => {
    it("formatString (static literal)", (_, done) => {
      const result = BASIC_FUNCTIONS.formatString(
        { value: "hello world" },
        context,
      ) as import("rxjs").Observable<string>;

      result.subscribe((val) => {
        assert.strictEqual(val, "hello world");
        done();
      });
    });

    it("formatString (with data binding)", (_, done) => {
      // Assuming dataModel has { "a": 10 } from setup
      const result = BASIC_FUNCTIONS.formatString(
        { value: "Value: ${a}" },
        context,
      ) as import("rxjs").Observable<string>;

      let emitCount = 0;
      const sub = result.subscribe({
        next: (val) => {
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
              sub.unsubscribe();
              done();
            }
          } catch (e) {
            done(e);
          }
        },
        error: (e) => {
          done(e);
        },
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

      const result = BASIC_FUNCTIONS.formatString(
        { value: "Result: ${add(a: 5, b: 7)}" },
        ctxWithInvoker,
      ) as import("rxjs").Observable<string>;

      result.subscribe((val) => {
        assert.strictEqual(val, "Result: 12");
        done();
      });
    });

    it("formatNumber", () => {
      // Test basic output as Intl behavior varies by environment.
      const result = BASIC_FUNCTIONS.formatNumber(
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
      const result = BASIC_FUNCTIONS.formatCurrency(
        { value: 1234.56, currency: "USD" },
        context,
      );
      assert.ok(typeof result === "string");
      assert.ok(result.includes("1,234.56") || result.includes("1234.56"));
      assert.ok(result.includes("$") || result.includes("USD"));
    });

    it("formatDate", () => {
      const result = BASIC_FUNCTIONS.formatDate(
        { value: "2025-01-01T00:00:00Z" },
        context,
      );
      assert.ok(typeof result === "string");
      assert.ok(result.length > 0);

      const resultISO = BASIC_FUNCTIONS.formatDate(
        { value: "2025-01-01T00:00:00Z", format: "ISO" },
        context,
      );
      assert.strictEqual(resultISO, "2025-01-01T00:00:00.000Z");
    });

    it("formatDate handles invalid dates", () => {
      const result = BASIC_FUNCTIONS.formatDate(
        { value: "invalid-date" },
        context,
      );
      assert.strictEqual(result, "");
    });

    it("formatDate uses options properly", () => {
      const result = BASIC_FUNCTIONS.formatDate(
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
      const result = BASIC_FUNCTIONS.formatDate(
        { value: "2025-01-01T00:00:00Z", locale: "invalid-locale-!!!11123" },
        context,
      );
      // It should fallback to .toISOString() which starts with 2025
      assert.ok(typeof result === "string" && result.includes("2025"));
    });

    it("formatCurrency fallback on formatting error", () => {
      const result = BASIC_FUNCTIONS.formatCurrency(
        { value: 1234.56, currency: "INVALID-CURRENCY", decimals: 2 },
        context,
      );
      // Fallbacks to toFixed
      assert.strictEqual(result, "1234.56");
    });

    it("pluralize", () => {
      assert.strictEqual(
        BASIC_FUNCTIONS.pluralize(
          { value: 1, one: "apple", other: "apples" },
          context,
        ),
        "apple",
      );
      assert.strictEqual(
        BASIC_FUNCTIONS.pluralize(
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
        BASIC_FUNCTIONS.openUrl({ url: "https://google.com" }, context);
        assert.strictEqual(openedUrl, "https://google.com");
      } finally {
        (global as any).window = originalWindow;
      }
    });
  });
});
