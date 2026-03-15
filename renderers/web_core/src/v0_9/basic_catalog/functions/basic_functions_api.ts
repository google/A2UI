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

import { z } from "zod";

// Arithmetic
export const AddApi = {
  name: "add" as const,
  returnType: "number" as const,
  schema: z.object({
    a: z.coerce.number().default(0),
    b: z.coerce.number().default(0),
  })
};

export const SubtractApi = {
  name: "subtract" as const,
  returnType: "number" as const,
  schema: z.object({
    a: z.coerce.number().default(0),
    b: z.coerce.number().default(0),
  })
};

export const MultiplyApi = {
  name: "multiply" as const,
  returnType: "number" as const,
  schema: z.object({
    a: z.coerce.number().default(0),
    b: z.coerce.number().default(0),
  })
};

export const DivideApi = {
  name: "divide" as const,
  returnType: "number" as const,
  schema: z.object({
    a: z.any(),
    b: z.any(),
  })
};

// Comparison
export const EqualsApi = {
  name: "equals" as const,
  returnType: "boolean" as const,
  schema: z.object({
    a: z.any(),
    b: z.any(),
  })
};

export const NotEqualsApi = {
  name: "not_equals" as const,
  returnType: "boolean" as const,
  schema: z.object({
    a: z.any(),
    b: z.any(),
  })
};

export const GreaterThanApi = {
  name: "greater_than" as const,
  returnType: "boolean" as const,
  schema: z.object({
    a: z.coerce.number().default(0),
    b: z.coerce.number().default(0),
  })
};

export const LessThanApi = {
  name: "less_than" as const,
  returnType: "boolean" as const,
  schema: z.object({
    a: z.coerce.number().default(0),
    b: z.coerce.number().default(0),
  })
};

// Logical
export const AndApi = {
  name: "and" as const,
  returnType: "boolean" as const,
  schema: z.object({
    values: z.array(z.any()).optional(),
    a: z.any().optional(),
    b: z.any().optional(),
  })
};

export const OrApi = {
  name: "or" as const,
  returnType: "boolean" as const,
  schema: z.object({
    values: z.array(z.any()).optional(),
    a: z.any().optional(),
    b: z.any().optional(),
  })
};

export const NotApi = {
  name: "not" as const,
  returnType: "boolean" as const,
  schema: z.object({
    value: z.any(),
  })
};

// String
export const ContainsApi = {
  name: "contains" as const,
  returnType: "boolean" as const,
  schema: z.object({
    string: z.coerce.string().default(""),
    substring: z.coerce.string().default(""),
  })
};

export const StartsWithApi = {
  name: "starts_with" as const,
  returnType: "boolean" as const,
  schema: z.object({
    string: z.coerce.string().default(""),
    prefix: z.coerce.string().default(""),
  })
};

export const EndsWithApi = {
  name: "ends_with" as const,
  returnType: "boolean" as const,
  schema: z.object({
    string: z.coerce.string().default(""),
    suffix: z.coerce.string().default(""),
  })
};

// Validation
export const RequiredApi = {
  name: "required" as const,
  returnType: "boolean" as const,
  schema: z.object({
    value: z.any(),
  })
};

export const RegexApi = {
  name: "regex" as const,
  returnType: "boolean" as const,
  schema: z.object({
    value: z.coerce.string().default(""),
    pattern: z.coerce.string().default(""),
  })
};

export const LengthApi = {
  name: "length" as const,
  returnType: "boolean" as const,
  schema: z.object({
    value: z.any(),
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
  })
};

export const NumericApi = {
  name: "numeric" as const,
  returnType: "boolean" as const,
  schema: z.object({
    value: z.coerce.number(),
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
  })
};

export const EmailApi = {
  name: "email" as const,
  returnType: "boolean" as const,
  schema: z.object({
    value: z.coerce.string().default(""),
  })
};

// Formatting
export const FormatStringApi = {
  name: "formatString" as const,
  returnType: "any" as const,
  schema: z.object({
    value: z.coerce.string().default(""),
  })
};

export const FormatNumberApi = {
  name: "formatNumber" as const,
  returnType: "string" as const,
  schema: z.object({
    value: z.coerce.number(),
    decimals: z.coerce.number().optional(),
    grouping: z.boolean().default(true),
  })
};

export const FormatCurrencyApi = {
  name: "formatCurrency" as const,
  returnType: "string" as const,
  schema: z.object({
    value: z.coerce.number(),
    currency: z.coerce.string().default("USD"),
    decimals: z.coerce.number().optional(),
    grouping: z.boolean().default(true),
  })
};

export const FormatDateApi = {
  name: "formatDate" as const,
  returnType: "string" as const,
  schema: z.object({
    value: z.any(),
    locale: z.coerce.string().default("en-US"),
    options: z.any().optional(),
    format: z.coerce.string().optional(),
  })
};

export const PluralizeApi = {
  name: "pluralize" as const,
  returnType: "string" as const,
  schema: z.object({
    value: z.coerce.number().default(0),
    zero: z.coerce.string().optional(),
    one: z.coerce.string().optional(),
    two: z.coerce.string().optional(),
    few: z.coerce.string().optional(),
    many: z.coerce.string().optional(),
    other: z.coerce.string().default(""),
  }).passthrough()
};

// Actions
export const OpenUrlApi = {
  name: "openUrl" as const,
  returnType: "void" as const,
  schema: z.object({
    url: z.coerce.string().default(""),
  })
};

export const BASIC_FUNCTION_APIS = [
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
  OpenUrlApi,
];
