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

/**
 * Strict Type Coercion Utilities
 * 
 * Implements the A2UI protocol's standard coercion rules to ensure
 * consistent handling of null/undefined values and type conversions.
 * 
 * Without central enforcement, component authors must manually handle
 * these edge cases, leading to bugs like [object Object] appearing
 * in text labels.
 */

/**
 * Coerces any value to a string following A2UI protocol rules:
 * - null/undefined → ""
 * - objects → localized string representation (not "[object Object]")
 * - other types → String(value)
 */
export function coerceToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    // Avoid "[object Object]" by using JSON.stringify for plain objects
    // or calling toString for objects with custom implementations
    if (Array.isArray(value)) {
      return value.map(coerceToString).join(", ");
    }
    if (value instanceof Error) {
      return value.message;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Coerces any value to a number following A2UI protocol rules:
 * - null/undefined → 0
 * - strings → parsed number (NaN becomes 0)
 * - booleans → 1 for true, 0 for false
 * - other types → Number(value)
 */
export function coerceToNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  const result = Number(value);
  return isNaN(result) ? 0 : result;
}

/**
 * Coerces any value to a boolean following A2UI protocol rules:
 * - "true" (case-insensitive) → true
 * - non-zero numbers → true
 * - null/undefined → false
 * - other types → Boolean(value)
 */
export function coerceToBoolean(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value !== "";
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return Boolean(value);
}

/**
 * Coerces a value to a specific target type.
 */
export function coerceValue<T>(value: unknown, targetType: "string"): string;
export function coerceValue<T>(value: unknown, targetType: "number"): number;
export function coerceValue<T>(value: unknown, targetType: "boolean"): boolean;
export function coerceValue<T>(value: unknown, targetType: string): unknown {
  switch (targetType) {
    case "string":
      return coerceToString(value);
    case "number":
      return coerceToNumber(value);
    case "boolean":
      return coerceToBoolean(value);
    default:
      return value;
  }
}
