
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface DateTimeInputRenderProps {
  label: string;
  value: string;
  min?: string;
  max?: string;
  enableDate: boolean;
  enableTime: boolean;
  onChange: (newValue: string) => void;
}

const dateTimeInputSchema = z.object({
  value: annotated(CommonTypes.DynamicString, "The selected date and/or time value in ISO 8601 format. If not yet set, initialize with an empty string."),
  enableDate: z.boolean().optional().describe("If true, allows the user to select a date."),
  enableTime: z.boolean().optional().describe("If true, allows the user to select a time."),
  min: annotated(CommonTypes.DynamicString, "The minimum allowed date/time in ISO 8601 format.").optional(),
  max: annotated(CommonTypes.DynamicString, "The maximum allowed date/time in ISO 8601 format.").optional(),
  label: annotated(CommonTypes.DynamicString, "The text label for the input field."),
  checks: z.array(CommonTypes.CheckRule).optional().describe('A list of checks to perform.')
});

export class DateTimeInputComponent<T> implements Component<T> {
  readonly name = 'DateTimeInput';
  readonly schema = dateTimeInputSchema;

  constructor(private readonly renderer: (props: DateTimeInputRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const value = context.resolve<string>(properties['value'] ?? '');
    const min = context.resolve<string>(properties['min'] ?? '');
    const max = context.resolve<string>(properties['max'] ?? '');
    const enableDate = (properties['enableDate'] as boolean) ?? true;
    const enableTime = (properties['enableTime'] as boolean) ?? false;

    const rawValue = properties['value'];
    const onChange = (newValue: string) => {
        if (typeof rawValue === 'object' && rawValue !== null && 'path' in rawValue) {
            context.dataContext.update(rawValue.path, newValue);
        }
    };

    return this.renderer({
      label,
      value,
      min,
      max,
      enableDate,
      enableTime,
      onChange
    }, context);
  }
}
