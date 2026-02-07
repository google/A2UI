
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface SliderRenderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (newValue: number) => void;
  weight?: number;
}

const sliderSchema = z.object({
  label: annotated(CommonTypes.DynamicString, "The label for the slider."),
  min: z.number().describe("The minimum value of the slider."),
  max: z.number().describe("The maximum value of the slider."),
  value: annotated(CommonTypes.DynamicNumber, "The current value of the slider."),
  checks: z.array(CommonTypes.CheckRule).optional().describe('A list of checks to perform.'),
  weight: CommonTypes.Weight.optional()
});

export class SliderComponent<T> implements Component<T> {
  readonly name = 'Slider';
  readonly schema = sliderSchema;

  constructor(private readonly renderer: (props: SliderRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const min = (properties['min'] as number) ?? 0;
    const max = (properties['max'] as number) ?? 100;
    const value = context.resolve<number>(properties['value'] ?? min);
    const weight = properties['weight'] as number | undefined;

    const rawValue = properties['value'];
    const onChange = (newValue: number) => {
        if (typeof rawValue === 'object' && rawValue !== null && 'path' in rawValue) {
            context.dataContext.update(rawValue.path, newValue);
        }
    };

    return this.renderer({
      label,
      min,
      max,
      value,
      onChange,
      weight
    }, context);
  }
}
