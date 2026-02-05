
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface CardRenderProps<T> {
  child: T | null;
}

export class CardComponent<T> implements Component<T> {
  readonly name = 'Card';

  constructor(private readonly renderer: (props: CardRenderProps<T>, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const childId = properties['child'];
    const child = childId ? context.renderChild(childId) : null;

    return this.renderer({ child }, context);
  }
}
