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
import { createFunctionImplementation, FunctionImplementation, isSignal } from "../../catalog/types.js";
import { format } from "date-fns";
import {
  AddApi,
  SubtractApi,
  MultiplyApi,
  DivideApi,
  EqualsApi,
  NotEqualsApi,
  GreaterThanApi,
  LessThanApi,
  AndApi,
  OrApi,
  NotApi,
  ContainsApi,
  StartsWithApi,
  EndsWithApi,
  RequiredApi,
  RegexApi,
  LengthApi,
  NumericApi,
  EmailApi,
  FormatStringApi,
  FormatNumberApi,
  FormatCurrencyApi,
  FormatDateApi,
  PluralizeApi,
  OpenUrlApi
} from "./basic_functions_api.js";
import { A2uiExpressionError } from "../../errors.js";

// Arithmetic
export const AddImplementation = createFunctionImplementation(AddApi, (args) => args.a + args.b);
export const SubtractImplementation = createFunctionImplementation(SubtractApi, (args) => args.a - args.b);
export const MultiplyImplementation = createFunctionImplementation(MultiplyApi, (args) => args.a * args.b);
export const DivideImplementation = createFunctionImplementation(DivideApi, (args) => {
  const a = args.a;
  const b = args.b;
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
});

// Comparison
export const EqualsImplementation = createFunctionImplementation(EqualsApi, (args) => args.a === args.b);
export const NotEqualsImplementation = createFunctionImplementation(NotEqualsApi, (args) => args.a !== args.b);
export const GreaterThanImplementation = createFunctionImplementation(GreaterThanApi, (args) => args.a > args.b);
export const LessThanImplementation = createFunctionImplementation(LessThanApi, (args) => args.a < args.b);

// Logical
export const AndImplementation = createFunctionImplementation(AndApi, (args) => {
  return args.values.every((v: unknown) => !!v);
});
export const OrImplementation = createFunctionImplementation(OrApi, (args) => {
  return args.values.some((v: unknown) => !!v);
});
export const NotImplementation = createFunctionImplementation(NotApi, (args) => !args.value);

// String
export const ContainsImplementation = createFunctionImplementation(ContainsApi, (args) => args.string.includes(args.substring));
export const StartsWithImplementation = createFunctionImplementation(StartsWithApi, (args) => args.string.startsWith(args.prefix));
export const EndsWithImplementation = createFunctionImplementation(EndsWithApi, (args) => args.string.endsWith(args.suffix));

// Validation
export const RequiredImplementation = createFunctionImplementation(RequiredApi, (args) => {
  const val = args.value;
  if (val === null || val === undefined) return false;
  if (typeof val === "string" && val === "") return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
});
export const RegexImplementation = createFunctionImplementation(RegexApi, (args) => {
  try {
    return new RegExp(args.pattern).test(args.value);
  } catch (e) {
    throw new A2uiExpressionError(`Invalid regex pattern: ${args.pattern}`, "regex", e);
  }
});
export const LengthImplementation = createFunctionImplementation(LengthApi, (args) => {
  const val = args.value;
  let len = 0;
  if (typeof val === "string" || Array.isArray(val)) {
    len = val.length;
  }
  if (args.min !== undefined && !isNaN(args.min) && len < args.min) return false;
  if (args.max !== undefined && !isNaN(args.max) && len > args.max) return false;
  return true;
});
export const NumericImplementation = createFunctionImplementation(NumericApi, (args) => {
  if (isNaN(args.value)) return false;
  if (args.min !== undefined && !isNaN(args.min) && args.value < args.min) return false;
  if (args.max !== undefined && !isNaN(args.max) && args.value > args.max) return false;
  return true;
});
export const EmailImplementation = createFunctionImplementation(EmailApi, (args) => {
  // TODO(gspencergoog): Use a "real" email validation function, preferably
  // from an existing package. This is woefully insufficient, real email
  // validation can't be done with a regex.
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(args.value);
});

// Formatting
export const FormatStringImplementation = createFunctionImplementation(FormatStringApi, (args, context) => {
  const template = args.value;
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
        if (isSignal(p)) {
           return p.value;
        }
        return p;
      })
      .join("");
  });
});
export const FormatNumberImplementation = createFunctionImplementation(FormatNumberApi, (args) => {
  if (isNaN(args.value)) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: args.decimals,
    maximumFractionDigits: args.decimals,
    useGrouping: args.grouping,
  }).format(args.value);
});
export const FormatCurrencyImplementation = createFunctionImplementation(FormatCurrencyApi, (args) => {
  if (isNaN(args.value)) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: args.currency,
      minimumFractionDigits: args.decimals,
      maximumFractionDigits: args.decimals,
      useGrouping: args.grouping,
    }).format(args.value);
  } catch (e) {
    return args.value.toFixed(args.decimals || 2);
  }
});
export const FormatDateImplementation = createFunctionImplementation(FormatDateApi, (args) => {
  if (!args.value) return "";
  const date = new Date(args.value as string | number | Date);
  if (isNaN(date.getTime())) return "";

  try {
    if (args.format === "ISO") return date.toISOString();
    return format(date, args.format);
  } catch (e) {
    console.warn("Error formatting date:", e);
    return date.toISOString();
  }
});
export const PluralizeImplementation = createFunctionImplementation(PluralizeApi, (args) => {
  const rule = new Intl.PluralRules("en-US").select(args.value);
  return String((args as any)[rule] || args.other || "");
});

// Actions
export const OpenUrlImplementation = createFunctionImplementation(OpenUrlApi, (args) => {
  if (args.url && typeof window !== "undefined" && window.open) {
    window.open(args.url, "_blank");
  }
});

/**
 * Standard function implementations for the Basic Catalog.
 * These functions cover arithmetic, comparison, logic, string manipulation, validation, and formatting.
 */
export const BASIC_FUNCTIONS: FunctionImplementation[] = [
  AddImplementation,
  SubtractImplementation,
  MultiplyImplementation,
  DivideImplementation,
  EqualsImplementation,
  NotEqualsImplementation,
  GreaterThanImplementation,
  LessThanImplementation,
  AndImplementation,
  OrImplementation,
  NotImplementation,
  ContainsImplementation,
  StartsWithImplementation,
  EndsWithImplementation,
  RequiredImplementation,
  RegexImplementation,
  LengthImplementation,
  NumericImplementation,
  EmailImplementation,
  FormatStringImplementation,
  FormatNumberImplementation,
  FormatCurrencyImplementation,
  FormatDateImplementation,
  PluralizeImplementation,
  OpenUrlImplementation
];