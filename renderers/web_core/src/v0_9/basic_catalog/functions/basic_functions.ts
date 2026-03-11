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

import { ExpressionParser } from "../expressions/expression_parser.js";
import { computed, Signal } from "@preact/signals-core";
import { FunctionImplementation } from "../../catalog/types.js";
import { A2uiExpressionError } from "../../errors.js";

/**
 * Standard function implementations for the Basic Catalog.
 * These functions cover arithmetic, comparison, logic, string manipulation, validation, and formatting.
 * They will throw A2uiExpressionError if arguments are invalid or missing.
 */
export const BASIC_FUNCTIONS: Record<string, FunctionImplementation> = {
  // Arithmetic
  /**
   * Adds `a` and `b` together.
   * Converts string values to numbers automatically.
   * Throws A2uiExpressionError if either `a` or `b` is undefined.
   */
  add: (args) => {
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      throw new A2uiExpressionError(
        `Function 'add' requires non-null arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      throw new A2uiExpressionError(
        `Function 'add' requires numeric arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    return numA + numB;
  },
  /**
   * Subtracts `b` from `a`.
   * Converts string values to numbers automatically.
   * Throws A2uiExpressionError if either `a` or `b` is undefined.
   */
  subtract: (args) => {
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      throw new A2uiExpressionError(
        `Function 'subtract' requires non-null arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      throw new A2uiExpressionError(
        `Function 'subtract' requires numeric arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    return numA - numB;
  },
  /**
   * Multiplies `a` by `b`.
   * Converts string values to numbers automatically.
   * Throws A2uiExpressionError if either `a` or `b` is undefined.
   */
  multiply: (args) => {
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      throw new A2uiExpressionError(
        `Function 'multiply' requires non-null arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      throw new A2uiExpressionError(
        `Function 'multiply' requires numeric arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    return numA * numB;
  },
  /**
   * Divides a by b.
   * Converts string values to numbers automatically.
   * Returns Infinity if division by zero occurs.
   * Throws A2uiExpressionError if either a or b is undefined, null, or cannot be converted to a number.
   */
  divide: (args) => {
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      throw new A2uiExpressionError(
        `Function 'divide' requires non-null arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      throw new A2uiExpressionError(
        `Function 'divide' requires numeric arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    if (numB === 0) {
      return Infinity;
    }
    return numA / numB;
  },

  // Comparison
  /**
   * Checks if `a` is strictly equal to `b`.
   * Throws A2uiExpressionError if either `a` or `b` is missing from arguments.
   */
  equals: (args) => {
    if (!("a" in args) || !("b" in args)) {
      throw new A2uiExpressionError(
        "Function 'equals' requires arguments 'a' and 'b'.",
      );
    }
    return args["a"] === args["b"];
  },
  /**
   * Checks if `a` is not strictly equal to `b`.
   * Throws A2uiExpressionError if either `a` or `b` is missing from arguments.
   */
  not_equals: (args) => {
    if (!("a" in args) || !("b" in args)) {
      throw new A2uiExpressionError(
        "Function 'not_equals' requires arguments 'a' and 'b'.",
      );
    }
    return args["a"] !== args["b"];
  },
  /**
   * Checks if numeric value of `a` is greater than `b`.
   * Throws A2uiExpressionError if either `a` or `b` is missing from arguments.
   */
  greater_than: (args) => {
    if (!("a" in args) || !("b" in args)) {
      throw new A2uiExpressionError(
        "Function 'greater_than' requires arguments 'a' and 'b'.",
      );
    }
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      throw new A2uiExpressionError(
        `Function 'greater_than' requires non-null arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      throw new A2uiExpressionError(
        `Function 'greater_than' requires numeric arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    return numA > numB;
  },
  /**
   * Checks if numeric value of `a` is less than `b`.
   * Throws A2uiExpressionError if either `a` or `b` is missing from arguments.
   */
  less_than: (args) => {
    if (!("a" in args) || !("b" in args)) {
      throw new A2uiExpressionError(
        "Function 'less_than' requires arguments 'a' and 'b'.",
      );
    }
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      throw new A2uiExpressionError(
        `Function 'less_than' requires non-null arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      throw new A2uiExpressionError(
        `Function 'less_than' requires numeric arguments 'a' and 'b'. Got a=${a}, b=${b}`,
      );
    }
    return numA < numB;
  },

  // Logical
  /**
   * Performs logical AND on an array of `values` or between `a` and `b`.
   * Throws A2uiExpressionError if neither `values` array nor `a` and `b` arguments are provided.
   */
  and: (args) => {
    if (Array.isArray(args["values"])) {
      return args["values"].every((v: unknown) => !!v);
    }
    if ("a" in args && "b" in args) {
      return !!(args["a"] && args["b"]);
    }
    throw new A2uiExpressionError(
      "Function 'and' requires either an array argument 'values' or arguments 'a' and 'b'.",
    );
  },
  /**
   * Performs logical OR on an array of `values` or between `a` and `b`.
   * Throws A2uiExpressionError if neither `values` array nor `a` and `b` arguments are provided.
   */
  or: (args) => {
    if (Array.isArray(args["values"])) {
      return args["values"].some((v: unknown) => !!v);
    }
    if ("a" in args && "b" in args) {
      return !!(args["a"] || args["b"]);
    }
    throw new A2uiExpressionError(
      "Function 'or' requires either an array argument 'values' or arguments 'a' and 'b'.",
    );
  },
  /**
   * Performs logical NOT on `value`.
   * Throws A2uiExpressionError if `value` is missing from arguments.
   */
  not: (args) => {
    if (!("value" in args)) {
      throw new A2uiExpressionError(
        "Function 'not' requires argument 'value'.",
      );
    }
    return !args["value"];
  },

  // String
  /**
   * Checks if `string` contains `substring`.
   * Throws A2uiExpressionError if either argument is missing.
   */
  contains: (args) => {
    if (!("string" in args) || !("substring" in args)) {
      throw new A2uiExpressionError(
        "Function 'contains' requires arguments 'string' and 'substring'.",
      );
    }
    return String(args["string"] || "").includes(
      String(args["substring"] || ""),
    );
  },
  /**
   * Checks if `string` starts with `prefix`.
   * Throws A2uiExpressionError if either argument is missing.
   */
  starts_with: (args) => {
    if (!("string" in args) || !("prefix" in args)) {
      throw new A2uiExpressionError(
        "Function 'starts_with' requires arguments 'string' and 'prefix'.",
      );
    }
    return String(args["string"] || "").startsWith(
      String(args["prefix"] || ""),
    );
  },
  /**
   * Checks if `string` ends with `suffix`.
   * Throws A2uiExpressionError if either argument is missing.
   */
  ends_with: (args) => {
    if (!("string" in args) || !("suffix" in args)) {
      throw new A2uiExpressionError(
        "Function 'ends_with' requires arguments 'string' and 'suffix'.",
      );
    }
    return String(args["string"] || "").endsWith(String(args["suffix"] || ""));
  },

  // Validation
  /**
   * Checks if a value is present and not empty.
   */
  required: (args) => {
    if (!("value" in args)) {
      throw new A2uiExpressionError(
        "Function 'required' requires argument 'value'.",
      );
    }
    const val = args["value"];
    if (val === null || val === undefined) return false;
    if (typeof val === "string" && val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  },

  /**
   * Checks if a value matches a regular expression.
   */
  regex: (args) => {
    if (!("value" in args) || !("pattern" in args)) {
      throw new A2uiExpressionError(
        "Function 'regex' requires arguments 'value' and 'pattern'.",
      );
    }
    const val = String(args["value"] || "");
    const pattern = String(args["pattern"] || "");
    try {
      return new RegExp(pattern).test(val);
    } catch (e) {
      throw new A2uiExpressionError(
        `Invalid regex pattern in 'regex' function: ${pattern}`,
      );
    }
  },

  /**
   * Checks if a value's length is within a specified range.
   */
  length: (args) => {
    if (!("value" in args)) {
      throw new A2uiExpressionError(
        "Function 'length' requires argument 'value'.",
      );
    }
    const val = args["value"];
    let len = 0;
    if (typeof val === "string" || Array.isArray(val)) {
      len = val.length;
    }
    const min = Number(args["min"]);
    const max = Number(args["max"]);
    if (!isNaN(min) && len < min) return false;
    if (!isNaN(max) && len > max) return false;
    return true;
  },

  /**
   * Checks if a value is numeric and optionally within a range.
   */
  numeric: (args) => {
    if (!("value" in args)) {
      throw new A2uiExpressionError(
        "Function 'numeric' requires argument 'value'.",
      );
    }
    const val = Number(args["value"]);
    if (isNaN(val)) return false;
    const min = Number(args["min"]);
    const max = Number(args["max"]);
    if (!isNaN(min) && val < min) return false;
    if (!isNaN(max) && val > max) return false;
    return true;
  },

  /**
   * Checks if a value is a valid email address.
   */
  email: (args) => {
    if (!("value" in args)) {
      throw new A2uiExpressionError(
        "Function 'email' requires argument 'value'.",
      );
    }
    const val = String(args["value"] || "");
    // Simple email regex
    // TODO: Use "real" email validation.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  },

  // Formatting
  /**
   * Formats a string using a template and the current context.
   */
  formatString: (args, context) => {
    const template = String(args["value"] || "");
    const parser = new ExpressionParser();
    const parts = parser.parse(template);

    if (parts.length === 0) return "";

    const dynamicParts = parts.map((part) => {
      // If it's a literal string (or number/boolean/etc), keep it as is
      if (typeof part !== "object" || part === null || Array.isArray(part)) {
        return part;
      }
      return context.resolveSignal(part);
    });

    return computed(() => {
      return dynamicParts
        .map((p) => {
          if (p instanceof Signal) {
             return p.value;
          }
          return p;
        })
        .join("");
    });
  },

  /**
   * Formats a number with locale support.
   */
  formatNumber: (args) => {
    const val = Number(args["value"]);
    if (isNaN(val)) return "";
    const decimals =
      args["decimals"] !== undefined ? Number(args["decimals"]) : undefined;
    const grouping = args["grouping"] !== false; // Default true
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    }).format(val);
  },

  /**
   * Formats a number as currency.
   */
  formatCurrency: (args) => {
    const val = Number(args["value"]);
    if (isNaN(val)) return "";
    const currency = String(args["currency"] || "USD");
    const decimals =
      args["decimals"] !== undefined ? Number(args["decimals"]) : undefined;
    const grouping = args["grouping"] !== false;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouping,
      }).format(val);
    } catch (e) {
      return val.toFixed(decimals || 2);
    }
  },

  /**
   * Formats a date.
   */
  formatDate: (args) => {
    const val = args["value"];
    if (!val) return "";
    const date = new Date(val as string | number | Date);
    if (isNaN(date.getTime())) return "";

    const locale = String(args["locale"] || "en-US");
    const options = args["options"] as Intl.DateTimeFormatOptions;

    try {
      if (options) {
        return new Intl.DateTimeFormat(locale, options).format(date);
      }

      // Fallback for simple format strings if we want to support them (optional)
      // For now, we'll default to standard date string or ISO if requested
      const format = String(args["format"] || "");
      if (format === "ISO") return date.toISOString();

      return new Intl.DateTimeFormat(locale).format(date);
    } catch (e) {
      console.warn("Error formatting date:", e);
      return date.toISOString();
    }
  },

  /**
   * Selects a string based on pluralization rules.
   */
  pluralize: (args) => {
    const val = Number(args["value"]) || 0;
    const rule = new Intl.PluralRules("en-US").select(val);
    // args: zero, one, two, few, many, other
    return String(args[rule] || args["other"] || "");
  },

  // Actions
  /**
   * Opens a URL in a new browser tab/window if available.
   */
  openUrl: (args) => {
    if (!("url" in args)) {
      throw new A2uiExpressionError(
        "Function 'openUrl' requires argument 'url'.",
      );
    }
    const url = String(args["url"] || "");
    if (url && typeof window !== "undefined" && window.open) {
      window.open(url, "_blank");
    }
  },
};
