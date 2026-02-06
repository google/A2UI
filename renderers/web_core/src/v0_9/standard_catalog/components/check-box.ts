
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface CheckBoxRenderProps {
  label: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

const checkBoxSchema = z.object({
  label: annotated(CommonTypes.DynamicString, "The text to display next to the checkbox."),
  value: annotated(CommonTypes.DynamicBoolean, "The current state of the checkbox (true for checked, false for unchecked)."),
  checks: z.array(CommonTypes.CheckRule).optional().describe('A list of checks to perform.')
});

export class CheckBoxComponent<T> implements Component<T> {
  readonly name = 'CheckBox';
  readonly schema = checkBoxSchema;

  constructor(private readonly renderer: (props: CheckBoxRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const value = context.resolve<boolean>(properties['value'] ?? false);
    
    const rawValue = properties['value'];
    
    const onChange = (newValue: boolean) => {
        if (typeof rawValue === 'object' && rawValue !== null && 'path' in rawValue) {
            context.dataContext.update(rawValue.path, newValue);
        }
    };

    return this.renderer({
      label,
      value,
      onChange
    }, context);
  }
}
