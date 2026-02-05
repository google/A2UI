
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface ContainerRenderProps<T> {
  children: T[];
  direction: 'row' | 'column';
}

export class ContainerComponent<T> implements Component<T> {
  constructor(
    readonly name: string,
    private readonly direction: 'row' | 'column',
    private readonly renderer: (props: ContainerRenderProps<T>) => T
  ) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    // Spec says: Must have children. 
    // children object must contain either 'explicitList' or 'template'.
    const renderedChildren = context.resolveChildren('children');

    return this.renderer({
      children: renderedChildren,
      direction: this.direction
    });
  }
}
