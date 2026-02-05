
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface CheckBoxRenderProps {
  label: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

export class CheckBoxComponent<T> implements Component<T> {
  readonly name = 'CheckBox';

  constructor(private readonly renderer: (props: CheckBoxRenderProps) => T) {}

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
    });
  }
}
