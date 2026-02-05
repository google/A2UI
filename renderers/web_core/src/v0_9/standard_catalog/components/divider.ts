
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface DividerRenderProps {
  axis: 'horizontal' | 'vertical';
}

export class DividerComponent<T> implements Component<T> {
  readonly name = 'Divider';

  constructor(private readonly renderer: (props: DividerRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const axis = (properties['axis'] as any) ?? 'horizontal';
    
    return this.renderer({ axis }, context);
  }
}
