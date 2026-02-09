
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface ButtonRenderProps<T> {
  label: string;
  disabled: boolean;
  onAction: () => void;
  child?: T;
  weight?: number;
}

const buttonSchema = z.object({
    child: annotated(CommonTypes.ComponentId, "The ID of the child component. Use a 'Text' component for a labeled button. Only use an 'Icon' if the requirements explicitly ask for an icon-only button. Do NOT define the child component inline."),
    variant: z.enum(["primary", "borderless"]).optional().describe("A hint for the button style. If omitted, a default button style is used. 'primary' indicates this is the main call-to-action button. 'borderless' means the button has no visual border or background, making its child content appear like a clickable link."),
    action: CommonTypes.Action,
    checks: z.array(CommonTypes.CheckRule).optional().describe('A list of checks to perform. These are function calls that must return a boolean indicating validity.'),
    weight: CatalogCommon.Weight.optional()
});

export class ButtonComponent<T> implements Component<T> {
  readonly name = 'Button';
  readonly schema = buttonSchema;

  constructor(private readonly renderer: (props: ButtonRenderProps<T>, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const label = context.resolve<string>(properties['label'] ?? '');
    const disabled = context.resolve<boolean>(properties['disabled'] ?? false);
    const action = properties['action'];
    const weight = properties['weight'] as number | undefined;

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
      child,
      weight
    }, context);
  }
}
