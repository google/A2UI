/*
 * Copyright 2026 Google LLC
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

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { InferredComponentApiSchemaType } from '../catalog/types.js';
import { ResolveA2uiProps } from './generic-binder.js';
import {
  TextApi,
  ChoicePickerApi,
  ColumnApi,
  ButtonApi
} from '../basic_catalog/components/basic_components.js';

/**
 * Type testing utilities
 * This creates a strict equality check that doesn't collapse on unions or `any`.
 */
export type IsEqual<T, U> =
    (<G>() => G extends T ? 1 : 2) extends
    (<G>() => G extends U ? 1 : 2)
        ? true
        : false;

export type Assert<T extends true> = T;

// 1. Test Text Component (Primitive resolution and setters)
type TextProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof TextApi>>;

// The 'text' property is a DynamicString, so it should resolve strictly to `string`
export type _TestTextProp = Assert<IsEqual<TextProps['text'], string>>;

// A setter 'setText' should be auto-generated because 'text' is Dynamic
export type _TestSetText = Assert<IsEqual<TextProps['setText'], (value: string) => void>>;

// 'variant' is static, so it should NOT generate a setter, and should retain its literal union
export type _TestVariantProp = Assert<IsEqual<TextProps['variant'], "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body" | undefined>>;

// @ts-expect-error - 'setVariant' should not exist
export type _TestNoSetVariant = TextProps['setVariant'];


// 2. Test ChoicePicker Component (Deep array resolution)
type ChoicePickerProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof ChoicePickerApi>>;

// 'value' is a DynamicStringList, it should resolve to `string[]`
export type _TestChoiceValue = Assert<IsEqual<ChoicePickerProps['value'], string[]>>;
export type _TestSetChoiceValue = Assert<IsEqual<ChoicePickerProps['setValue'], (value: string[]) => void>>;

// 'options' is an array of objects. Its nested 'label' is dynamic, 'value' is static.
export type _TestOptionsLabel = Assert<IsEqual<ChoicePickerProps['options'][0]['label'], string>>;
export type _TestOptionsSetLabel = Assert<IsEqual<ChoicePickerProps['options'][0]['setLabel'], (value: string) => void>>;
export type _TestOptionsValue = Assert<IsEqual<ChoicePickerProps['options'][0]['value'], string>>;
// @ts-expect-error - 'value' inside options is static, so it shouldn't generate 'setValue'
export type _TestOptionsNoSetValue = ChoicePickerProps['options'][0]['setValue'];


// 3. Test Column Component (Structural ChildList resolution)
type ColumnProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof ColumnApi>>;

// 'children' is a ChildList, resolving to ResolvedChildNode[]
export type _TestColumnChildren = Assert<IsEqual<ColumnProps['children'], { id: string; basePath?: string }[]>>;

// @ts-expect-error - 'children' is not dynamic in the sense of two-way data binding, so no setter
export type _TestNoSetChildren = ColumnProps['setChildren'];


// 4. Test Button Component (Action resolution)
type ButtonProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof ButtonApi>>;

// 'action' is an Action, resolving to a callable function
export type _TestButtonAction = Assert<IsEqual<ButtonProps['action'], () => void>>;

// 5. Test @ts-expect-error Negative Cases directly
export function runtimeTypeCheckTests() {
  const textProps = {} as TextProps;
  
  // @ts-expect-error - text should strictly be a string, not a number
  const invalidAssignment: number = textProps.text;

  // @ts-expect-error - action must be a function
  const invalidAction: string = ({} as ButtonProps).action;
  
  return [invalidAssignment, invalidAction];
}

describe('Generic Binder Types', () => {
  it('should pass type-level compilation checks', () => {
    // If tsc compiles this file, all type assertions (`Assert<IsEqual<...>>`) are valid
    // and all `@ts-expect-error` directives successfully caught the intended failures.
    assert.ok(true, "Type assertions passed");
  });
});
