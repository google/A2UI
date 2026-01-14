/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { StringValue, NumberValue, BooleanValue } from "../types/primitives.js";
import {
  AnyComponentNode,
  ComponentArrayReference,
  ValueMap,
} from "../types/types.js";

export function isValueMap(value: unknown): value is ValueMap {
  return isObject(value) && "key" in value;
}

export function isPath(key: string, value: unknown): value is string {
  return key === "path" && typeof value === "string";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isComponentArrayReference(
  value: unknown
): value is ComponentArrayReference {
  if (!isObject(value)) return false;
  return "explicitList" in value || "template" in value;
}

function isStringValue(value: unknown): value is StringValue {
  return (
    isObject(value) &&
    ("path" in value ||
      ("literal" in value && typeof value.literal === "string") ||
      "literalString" in value)
  );
}

function isNumberValue(value: unknown): value is NumberValue {
  return (
    isObject(value) &&
    ("path" in value ||
      ("literal" in value && typeof value.literal === "number") ||
      "literalNumber" in value)
  );
}

function isBooleanValue(value: unknown): value is BooleanValue {
  return (
    isObject(value) &&
    ("path" in value ||
      ("literal" in value && typeof value.literal === "boolean") ||
      "literalBoolean" in value)
  );
}

function isAnyComponentNode(value: unknown): value is AnyComponentNode {
  if (!isObject(value)) return false;
  const hasBaseKeys = "id" in value && "type" in value && "properties" in value;
  if (!hasBaseKeys) return false;

  return true;
}