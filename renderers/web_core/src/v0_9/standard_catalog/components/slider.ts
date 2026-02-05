
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface SliderRenderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (newValue: number) => void;
}

export class SliderComponent<T> implements Component<T> {
  readonly name = 'Slider';

  constructor(private readonly renderer: (props: SliderRenderProps) => T) {}

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const min = (properties['min'] as number) ?? 0;
    const max = (properties['max'] as number) ?? 100;
    const value = context.resolve<number>(properties['value'] ?? min);

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
      onChange
    });
  }
}
