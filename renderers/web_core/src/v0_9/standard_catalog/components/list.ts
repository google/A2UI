
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface ListRenderProps<T> {
  children: T[];
  direction: 'vertical' | 'horizontal';
  align: 'start' | 'center' | 'end' | 'stretch';
}

export class ListComponent<T> implements Component<T> {
  readonly name = 'List';

  constructor(private readonly renderer: (props: ListRenderProps<T>, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const childrenProp = properties['children'];
    const renderedChildren: T[] = [];

    if (childrenProp) {
        if (childrenProp.explicitList) {
            const list = childrenProp.explicitList as string[];
            for (const childId of list) {
                const child = context.renderChild(childId);
                if (child) renderedChildren.push(child);
            }
        }
    }

    const direction = (properties['direction'] as any) ?? 'vertical';
    const align = (properties['align'] as any) ?? 'start';

    return this.renderer({
      children: renderedChildren,
      direction,
      align
    }, context);
  }
}
