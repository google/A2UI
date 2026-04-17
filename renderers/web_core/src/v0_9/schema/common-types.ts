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

import {z} from 'zod';

export interface DataBinding {
  path: string;
}

export const DataBindingSchema: z.ZodType<DataBinding> = z
  .object({
    path: z
      .string()
      .describe('A JSON Pointer path to a value in the data model.'),
  })
  .describe(
    'REF:common_types.json#/$defs/DataBinding|A JSON Pointer path to a value in the data model.',
  );

const FUNCTION_CALL_RETURN_TYPE_VALUES = [
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'any',
  'void',
] as const;
type FunctionCallReturnType = (typeof FUNCTION_CALL_RETURN_TYPE_VALUES)[number];

export interface FunctionCall {
  call: string;
  args: Record<string, any>;
  returnType?: FunctionCallReturnType;
}

export const FunctionCallSchema: z.ZodType<FunctionCall> = z
  .object({
    call: z.string().describe('The name of the function to call.'),
    args: z.record(z.any()).describe('Arguments passed to the function.'),
    returnType: z.enum(FUNCTION_CALL_RETURN_TYPE_VALUES).default('boolean'),
  })
  .describe(
    'REF:common_types.json#/$defs/FunctionCall|Invokes a named function on the client.',
  );

export type DynamicBoolean = boolean | DataBinding | FunctionCall;

export const DynamicBooleanSchema: z.ZodType<DynamicBoolean> = z
  .union([z.boolean(), DataBindingSchema, FunctionCallSchema])
  .describe(
    'REF:common_types.json#/$defs/DynamicBoolean|A boolean value that can be a literal, a path, or a function call returning a boolean.',
  );

export type DynamicString = string | DataBinding | FunctionCall;

export const DynamicStringSchema: z.ZodType<DynamicString> = z
  .union([z.string(), DataBindingSchema, FunctionCallSchema])
  .describe('REF:common_types.json#/$defs/DynamicString|Represents a string');

export type DynamicNumber = number | DataBinding | FunctionCall;

export const DynamicNumberSchema: z.ZodType<DynamicNumber> = z
  .union([z.number(), DataBindingSchema, FunctionCallSchema])
  .describe(
    'REF:common_types.json#/$defs/DynamicNumber|Represents a value that can be either a literal number, a path to a number in the data model, or a function call returning a number.',
  );

export type DynamicStringList = string[] | DataBinding | FunctionCall;

export const DynamicStringListSchema: z.ZodType<DynamicStringList> = z
  .union([z.array(z.string()), DataBindingSchema, FunctionCallSchema])
  .describe(
    'REF:common_types.json#/$defs/DynamicStringList|Represents a value that can be either a literal array of strings, a path to a string array in the data model, or a function call returning a string array.',
  );

export type DynamicValue =
  | string
  | number
  | boolean
  | any[]
  | DataBinding
  | FunctionCall;

export const DynamicValueSchema: z.ZodType<DynamicValue> = z
  .union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    DataBindingSchema,
    FunctionCallSchema,
  ])
  .describe(
    'REF:common_types.json#/$defs/DynamicValue|A value that can be a literal, a path, or a function call returning any type.',
  );

export type ComponentId = string;

export const ComponentIdSchema: z.ZodType<ComponentId> = z
  .string()
  .describe(
    'REF:common_types.json#/$defs/ComponentId|The unique identifier for a component.',
  );

export type ChildList =
  | ComponentId[]
  | {
      componentId: ComponentId;
      path: string;
    };

export const ChildListSchema: z.ZodType<ChildList> = z
  .union([
    z
      .array(ComponentIdSchema)
      .describe('A static list of child component IDs.'),
    z
      .object({
        componentId: ComponentIdSchema,
        path: z
          .string()
          .describe(
            'The path to the list of component property objects in the data model.',
          ),
      })
      .describe('A template for generating a dynamic list of children.'),
  ])
  .describe('REF:common_types.json#/$defs/ChildList');

export type Action =
  | {
      event: {
        name: string;
        context?: Record<string, DynamicValue>;
      };
    }
  | {
      functionCall: FunctionCall;
    };

export const ActionSchema: z.ZodType<Action> = z
  .union([
    z
      .object({
        event: z.object({
          name: z.string(),
          context: z.record(DynamicValueSchema).optional(),
        }),
      })
      .describe('Triggers a server-side event.'),
    z
      .object({
        functionCall: FunctionCallSchema,
      })
      .describe('Executes a local client-side function.'),
  ])
  .describe('REF:common_types.json#/$defs/Action');

export interface CheckRule {
  condition: DynamicBoolean;
  message: string;
}

export const CheckRuleSchema: z.ZodType<CheckRule> = z
  .object({
    condition: DynamicBooleanSchema,
    message: z
      .string()
      .describe('The error message to display if the check fails.'),
  })
  .describe(
    'REF:common_types.json#/$defs/CheckRule|A check rule consisting of a condition and an error message.',
  );

export interface Checkable {
  checks?: CheckRule[];
}

export const ChecksSchema = z
  .array(CheckRuleSchema)
  .optional()
  .describe('A list of checks to perform.');

export const CheckableSchema: z.ZodType<Checkable> = z
  .object({
    checks: ChecksSchema,
  })
  .describe(
    'REF:common_types.json#/$defs/Checkable|Properties for components that support client-side checks.',
  );

export interface AccessibilityAttributes {
  label?: DynamicString;
  description?: DynamicString;
}

export const AccessibilityAttributesSchema: z.ZodType<AccessibilityAttributes> =
  z
    .object({
      label: DynamicStringSchema.optional().describe(
        'REF:common_types.json#/$defs/DynamicString|A short string used by assistive technologies to convey the purpose of an element.',
      ),
      description: DynamicStringSchema.optional().describe(
        'REF:common_types.json#/$defs/DynamicString|Additional information provided by assistive technologies about an element.',
      ),
    })
    .describe(
      'REF:common_types.json#/$defs/AccessibilityAttributes|Attributes to enhance accessibility.',
    );

export interface AnyComponent {
  component: string;
  id?: ComponentId;
  weight?: number;
  [key: string]: any;
}

export const AnyComponentSchema: z.ZodType<AnyComponent> = z
  .object({
    component: z.string().describe('The type name of the component.'),
    id: ComponentIdSchema.optional(),
    weight: z.number().optional(),
  })
  .passthrough()
  .describe('A generic A2UI component definition.');

export const CommonSchemas = {
  ComponentId: ComponentIdSchema,
  ChildList: ChildListSchema,
  DataBinding: DataBindingSchema,
  DynamicValue: DynamicValueSchema,
  DynamicString: DynamicStringSchema,
  DynamicNumber: DynamicNumberSchema,
  DynamicBoolean: DynamicBooleanSchema,
  DynamicStringList: DynamicStringListSchema,
  FunctionCall: FunctionCallSchema,
  CheckRule: CheckRuleSchema,
  Checkable: CheckableSchema,
  Checks: ChecksSchema,
  Action: ActionSchema,
  AccessibilityAttributes: AccessibilityAttributesSchema,
  AnyComponent: AnyComponentSchema,
};
