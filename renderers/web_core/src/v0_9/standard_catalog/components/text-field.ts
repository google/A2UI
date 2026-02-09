
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface TextFieldRenderProps {
  label: string;
  value: string;
  variant: 'longText' | 'number' | 'shortText' | 'obscured';
  onChange: (newValue: string) => void;
  weight?: number;
}

const textFieldSchema = z.object({
  label: annotated(CommonTypes.DynamicString, "The text label for the input field."),
  value: annotated(CommonTypes.DynamicString, "The value of the text field."),
  variant: z.enum(["longText", "number", "shortText", "obscured"]).optional().describe("The type of input field to display."),
  checks: z.array(CommonTypes.CheckRule).optional().describe('A list of checks to perform.'),
  weight: CatalogCommon.Weight.optional()
});

export class TextFieldComponent<T> implements Component<T> {
  readonly name = 'TextField';
  readonly schema = textFieldSchema;

  constructor(private readonly renderer: (props: TextFieldRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const value = context.resolve<string>(properties['value'] ?? '');
    const variant = (properties['variant'] as any) ?? 'shortText';
    const weight = properties['weight'] as number | undefined;

    // We need to know the path of 'value' to update it?
    // Spec says: value is a DynamicString. 
    // To support 2-way binding, we usually need the path. 
    // context.resolve resolves the value. 
    // If it was a path object { path: '...' }, context.resolve handles it.
    // HOW do we get the path to update?
    // context properties['value'] might be { path: '...' } or just a string literal.
    // If it's a literal, onChange won't do anything useful in DataModel, but might locally?
    // We need a way to detect if it's a binding.
    // Let's assume for now we might inspect the raw property if needed, 
    // OR we just emit an action/update if we can? 
    // Actually, Core `ComponentContext` doesn't expose `updateData` directly, 
    // but `DataContext` does.
    
    const rawValue = properties['value'];
    
    const onChange = (newValue: string) => {
        if (typeof rawValue === 'object' && rawValue !== null && 'path' in rawValue) {
            // It's a binding!
            context.dataContext.update(rawValue.path, newValue);
        }
    };

    return this.renderer({
      label,
      value,
      variant,
      onChange,
      weight
    }, context);
  }
}
