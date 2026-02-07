
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';

import { CommonTypes } from '../../catalog/schema_types.js';

export interface DividerRenderProps {
  axis: 'horizontal' | 'vertical';
  weight?: number;
}

const dividerSchema = z.object({
  axis: z.enum(["horizontal", "vertical"]).default("horizontal").describe("The orientation of the divider."),
  weight: CommonTypes.Weight.optional()
});

export class DividerComponent<T> implements Component<T> {
  readonly name = 'Divider';
  readonly schema = dividerSchema;

  constructor(private readonly renderer: (props: DividerRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const axis = (properties['axis'] as any) ?? 'horizontal';
    const weight = properties['weight'] as number | undefined;
    
    return this.renderer({ axis, weight }, context);
  }
}
