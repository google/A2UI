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
import { Observable, combineLatest, of } from "rxjs";
import { map } from "rxjs/operators";
import { FunctionImplementation } from "../../catalog/types.js";

/**
 * Standard function implementations for the Basic Catalog.
 * These functions cover arithmetic, comparison, logic, string manipulation, validation, and formatting.
 */
export const BASIC_FUNCTIONS: Record<string, FunctionImplementation> = {
  // Arithmetic
  add: (args) => (Number(args["a"]) || 0) + (Number(args["b"]) || 0),
  subtract: (args) => (Number(args["a"]) || 0) - (Number(args["b"]) || 0),
  multiply: (args) => (Number(args["a"]) || 0) * (Number(args["b"]) || 0),
  /**
   * Divides a by b.
   * Converts string values to numbers automatically.
   * Returns Infinity if division by zero occurs.
   * Returns NaN if either a or b is undefined, null, or cannot be converted to a number.
   */
  divide: (args) => {
    const a = args["a"];
    const b = args["b"];
    if (a === undefined || a === null || b === undefined || b === null) {
      return NaN;
    }
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return NaN;
    }
    if (numB === 0) {
      return Infinity;
    }
    return numA / numB;
  },

  // Comparison
  equals: (args) => args["a"] === args["b"],
  not_equals: (args) => args["a"] !== args["b"],
  greater_than: (args) => (Number(args["a"]) || 0) > (Number(args["b"]) || 0),
  less_than: (args) => (Number(args["a"]) || 0) < (Number(args["b"]) || 0),

  // Logical
  and: (args) => {
    if (Array.isArray(args["values"])) {
      return args["values"].every((v: unknown) => !!v);
    }
    return !!(args["a"] && args["b"]); // Fallback
  },
  or: (args) => {
    if (Array.isArray(args["values"])) {
      return args["values"].some((v: unknown) => !!v);
    }
    return !!(args["a"] || args["b"]); // Fallback
  },
  not: (args) => !args["value"],

  // String
  contains: (args) =>
    String(args["string"] || "").includes(String(args["substring"] || "")),
  starts_with: (args) =>
    String(args["string"] || "").startsWith(String(args["prefix"] || "")),
  ends_with: (args) =>
    String(args["string"] || "").endsWith(String(args["suffix"] || "")),

  // Validation
  /**
   * Checks if a value is present and not empty.
   */
  required: (args) => {
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
    const val = String(args["value"] || "");
    const pattern = String(args["pattern"] || "");
    try {
      return new RegExp(pattern).test(val);
    } catch (e) {
      console.warn("Invalid regex pattern:", pattern);
      return false;
    }
  },

  /**
   * Checks if a value's length is within a specified range.
   */
  length: (args) => {
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

    const observables = parts.map((part) => {
      // If it's a literal string (or number/boolean/etc), wrap it in 'of'
      if (typeof part !== "object" || part === null || Array.isArray(part)) {
        return of(part);
      }

      // Otherwise, it's a dynamic value we need to subscribe to
      return new Observable<unknown>((subscriber) => {
        const sub = context.subscribeDynamicValue(part, (val) => {
          subscriber.next(val);
        });

        // Emit the initial synchronously-resolved value
        subscriber.next(sub.value);

        return () => sub.unsubscribe();
      });
    });

    // Combine all parts and join them into a single string whenever any part changes
    return combineLatest(observables).pipe(map((values) => values.join("")));
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
    const url = String(args["url"] || "");
    if (url && typeof window !== "undefined" && window.open) {
      window.open(url, "_blank");
    }
  },
};
