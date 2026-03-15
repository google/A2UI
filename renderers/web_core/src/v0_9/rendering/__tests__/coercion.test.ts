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

import { describe, it, expect } from "vitest";
import { coerceToString, coerceToNumber, coerceToBoolean, coerceValue } from "../coercion.js";

describe("coerceToString", () => {
  it("converts null to empty string", () => {
    expect(coerceToString(null)).toBe("");
  });

  it("converts undefined to empty string", () => {
    expect(coerceToString(undefined)).toBe("");
  });

  it("converts objects to JSON", () => {
    expect(coerceToString({ a: 1 })).toBe('{"a":1}');
  });

  it("converts arrays to comma-separated string", () => {
    expect(coerceToString([1, 2, 3])).toBe("1, 2, 3");
  });

  it("extracts Error message", () => {
    expect(coerceToString(new Error("test error"))).toBe("test error");
  });

  it("converts Date using toString", () => {
    const date = new Date("2025-01-01");
    expect(coerceToString(date)).toBe(date.toString());
  });
});

describe("coerceToNumber", () => {
  it("converts null to 0", () => {
    expect(coerceToNumber(null)).toBe(0);
  });

  it("converts undefined to 0", () => {
    expect(coerceToNumber(undefined)).toBe(0);
  });

  it("parses string numbers", () => {
    expect(coerceToNumber("42")).toBe(42);
    expect(coerceToNumber("3.14")).toBe(3.14);
  });

  it("converts invalid strings to 0", () => {
    expect(coerceToNumber("invalid")).toBe(0);
  });

  it("converts booleans", () => {
    expect(coerceToNumber(true)).toBe(1);
    expect(coerceToNumber(false)).toBe(0);
  });
});

describe("coerceToBoolean", () => {
  it("converts null to false", () => {
    expect(coerceToBoolean(null)).toBe(false);
  });

  it("converts undefined to false", () => {
    expect(coerceToBoolean(undefined)).toBe(false);
  });

  it('converts "true" (case-insensitive) to true', () => {
    expect(coerceToBoolean("true")).toBe(true);
    expect(coerceToBoolean("TRUE")).toBe(true);
    expect(coerceToBoolean("True")).toBe(true);
  });

  it('converts "false" to false (not true!)', () => {
    expect(coerceToBoolean("false")).toBe(false);
  });

  it("converts non-zero numbers to true", () => {
    expect(coerceToBoolean(1)).toBe(true);
    expect(coerceToBoolean(-1)).toBe(true);
    expect(coerceToBoolean(0)).toBe(false);
  });

  it("converts empty string to false", () => {
    expect(coerceToBoolean("")).toBe(false);
  });

  it("converts non-'true' strings to false", () => {
    expect(coerceToBoolean("yes")).toBe(false);
    expect(coerceToBoolean("1")).toBe(false);
  });
});

describe("coerceValue", () => {
  it("delegates to appropriate coercer", () => {
    expect(coerceValue(null, "string")).toBe("");
    expect(coerceValue(null, "number")).toBe(0);
    expect(coerceValue(null, "boolean")).toBe(false);
  });
});
