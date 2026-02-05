
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface DateTimeInputRenderProps {
  label: string;
  value: string;
  min?: string;
  max?: string;
  enableDate: boolean;
  enableTime: boolean;
  onChange: (newValue: string) => void;
}

export class DateTimeInputComponent<T> implements Component<T> {
  readonly name = 'DateTimeInput';

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
