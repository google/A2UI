
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface ButtonRenderProps {
  label: string;
  disabled: boolean;
  onAction: () => void;
  // TODO: Add support for 'child' property if button can have icons/custom content? 
  // Spec says: "Required: Must have label and action properties." 
  // It doesn't mention children for button in the validation rules provided in user_rules.
}

export class ButtonComponent<T> implements Component<T> {
  readonly name = 'Button';

  constructor(private readonly renderer: (props: ButtonRenderProps) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const disabled = context.resolve<boolean>(properties['disabled'] ?? false);
    const action = properties['action'];

    const onAction = () => {
      if (!disabled && action) {
        context.dispatchAction(action);
      }
    };

    return this.renderer({
      label,
      disabled,
      onAction
    });
  }
}
