import { z } from 'zod';
import { CommonSchemas, DataBinding, FunctionCall, Action, ChildList } from '../schema/common-types.js';

type DynamicTypes = DataBinding | FunctionCall;
type ResolvedChildNode = { id: string; basePath?: string };

type IsAction<T> = [NonNullable<T>] extends [Action] ? true : false;
type IsChildList<T> = [NonNullable<T>] extends [ChildList] ? true : false;

export type ResolveA2uiProp<T> = IsAction<T> extends true
  ? (() => void) | Extract<T, undefined>
  : IsChildList<T> extends true
    ? ResolvedChildNode[] | Extract<T, undefined>
    : Exclude<NonNullable<T>, DynamicTypes> extends Array<infer U>
      ? Array<ResolveA2uiProp<U>> | Extract<T, undefined>
      : Exclude<NonNullable<T>, DynamicTypes> extends object
        ? ResolveA2uiProps<Exclude<NonNullable<T>, DynamicTypes>> | Extract<T, undefined>
        : Exclude<T, DynamicTypes>;

export type GenerateSetters<T> = {
  [K in keyof T as DataBinding extends NonNullable<T[K]>
    ? `set${Capitalize<string & K>}`
    : never]-?: (value: Exclude<NonNullable<T[K]>, DynamicTypes>) => void;
};

export type ResolveA2uiProps<T> = T extends object
  ? {
      [K in keyof T]: ResolveA2uiProp<T[K]>;
    } & GenerateSetters<T> & {
      isValid?: boolean;
      validationErrors?: string[];
    }
  : T;

import { ChoicePickerApi, TextApi, ColumnApi } from '../basic_catalog/components/basic_components.js';
import { InferredComponentApiSchemaType } from '../catalog/types.js';

type ChoicePickerProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof ChoicePickerApi>>;
declare const p: ChoicePickerProps;
const testVal1: string[] | undefined = p.value;
const testLabel: string = p.options[0].label;
p.options[0].setLabel("new label");

type TextProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof TextApi>>;
declare const t: TextProps;
const testText: string = t.text;

type ColumnProps = ResolveA2uiProps<InferredComponentApiSchemaType<typeof ColumnApi>>;
declare const c: ColumnProps;
const testChildren: ResolvedChildNode[] = c.children;

