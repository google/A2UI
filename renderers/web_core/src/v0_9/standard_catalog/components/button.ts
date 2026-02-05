
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface ButtonRenderProps<T> {
  label: string;
  disabled: boolean;
  onAction: () => void;
  child?: T;
}

export class ButtonComponent<T> implements Component<T> {
  readonly name = 'Button';

  constructor(private readonly renderer: (props: ButtonRenderProps<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const disabled = context.resolve<boolean>(properties['disabled'] ?? false);
    const action = properties['action'];

    // Resolve optional child
    const child = context.resolveChild('child');

    const onAction = () => {
      if (!disabled && action) {
        context.dispatchAction(action);
      }
    };

    return this.renderer({
      label,
      disabled,
      onAction,
      child
    });
  }
}
