
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';

export interface DividerRenderProps {
  axis: 'horizontal' | 'vertical';
}

const dividerSchema = z.object({
  axis: z.enum(["horizontal", "vertical"]).default("horizontal").describe("The orientation of the divider.")
});

export class DividerComponent<T> implements Component<T> {
  readonly name = 'Divider';
  readonly schema = dividerSchema;

  constructor(private readonly renderer: (props: DividerRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const axis = (properties['axis'] as any) ?? 'horizontal';
    
    return this.renderer({ axis }, context);
  }
}
