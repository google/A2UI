
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface ListRenderProps<T> {
  children: T[];
  direction: 'vertical' | 'horizontal';
  align: 'start' | 'center' | 'end' | 'stretch';
  weight?: number;
}

const listSchema = z.object({
  children: annotated(CommonTypes.ChildList, "Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list."),
  direction: z.enum(["vertical", "horizontal"]).optional().describe("The direction in which the list items are laid out."),
  align: z.enum(["start", "center", "end", "stretch"]).optional().describe("Defines the alignment of children along the cross axis."),
  weight: CatalogCommon.Weight.optional()
});

export class ListComponent<T> implements Component<T> {
  readonly name = 'List';
  readonly schema = listSchema;

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
    const weight = properties['weight'] as number | undefined;

    return this.renderer({
      children: renderedChildren,
      direction,
      align,
      weight
    }, context);
  }
}
