
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface ChoiceOption {
  label: string;
  value: string;
}

export interface ChoicePickerRenderProps {
  label: string;
  options: ChoiceOption[];
  value: string[];
  variant: 'multipleSelection' | 'mutuallyExclusive';
  onChange: (newValue: string[]) => void;
  weight?: number;
}

const choicePickerSchema = z.object({
  label: annotated(CommonTypes.DynamicString, "The label for the group of options."),
  variant: z.enum(["multipleSelection", "mutuallyExclusive"]).optional().describe("A hint for how the choice picker should be displayed and behave."),
  options: z.array(z.object({
    label: annotated(CommonTypes.DynamicString, "The text to display for this option."),
    value: z.string().describe("The stable value associated with this option.")
  })).describe("The list of available options to choose from."),
  value: annotated(CommonTypes.DynamicStringList, "The list of currently selected values. This should be bound to a string array in the data model."),
  checks: z.array(CommonTypes.CheckRule).optional().describe('A list of checks to perform.'),
  weight: CommonTypes.Weight.optional()
});

export class ChoicePickerComponent<T> implements Component<T> {
  readonly name = 'ChoicePicker';
  readonly schema = choicePickerSchema;

  constructor(private readonly renderer: (props: ChoicePickerRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const optionsProp = properties['options'] as any[];
    const options: ChoiceOption[] = [];

    if (Array.isArray(optionsProp)) {
        for (const opt of optionsProp) {
            const optLabel = context.resolve<string>(opt.label ?? '');
            const optValue = opt.value; // Value is likely static string as per spec
            options.push({ label: optLabel, value: optValue });
        }
    }

    const value = context.resolve<string[]>(properties['value'] ?? []);
    const variant = (properties['variant'] as any) ?? 'multipleSelection';
    const weight = properties['weight'] as number | undefined;

    const rawValue = properties['value'];
    const onChange = (newValue: string[]) => {
        if (typeof rawValue === 'object' && rawValue !== null && 'path' in rawValue) {
            context.dataContext.update(rawValue.path, newValue);
        }
    };

    return this.renderer({
      label,
      options,
      value,
      variant,
      onChange,
      weight
    }, context);
  }
}
