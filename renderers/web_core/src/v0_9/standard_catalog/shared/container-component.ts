
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';

export interface ContainerRenderProps<T> {
  children: T[];
  direction: 'row' | 'column';
  justify?: string;
  align?: string;
}

export class ContainerComponent<T> implements Component<T> {
  constructor(
    readonly name: string,
    readonly schema: z.ZodType<any>,
    private readonly direction: 'row' | 'column',
    private readonly renderer: (props: ContainerRenderProps<T>, context: ComponentContext<T>) => T
  ) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    // children object must contain either 'explicitList' or 'template'.
    const renderedChildren = context.resolveChildren('children');
    const justify = properties['justify'];
    const align = properties['align'];

    return this.renderer({
      children: renderedChildren,
      direction: this.direction,
      justify,
      align
    }, context);
  }
}
