
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface CardRenderProps<T> {
  child: T | null;
}

const cardSchema = z.object({
  child: annotated(CommonTypes.ComponentId, "The ID of the single child component to be rendered inside the card. To display multiple elements, you MUST wrap them in a layout component (like Column or Row) and pass that container's ID here. Do NOT pass multiple IDs or a non-existent ID. Do NOT define the child component inline.")
});

export class CardComponent<T> implements Component<T> {
  readonly name = 'Card';
  readonly schema = cardSchema;

  constructor(private readonly renderer: (props: CardRenderProps<T>, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const childId = properties['child'];
    const child = childId ? context.renderChild(childId) : null;

    return this.renderer({ child }, context);
  }
}
