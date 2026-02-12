
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface TabItem<T> {
  title: string;
  child: T | null;
}

export interface TabsRenderProps<T> {
  tabs: TabItem<T>[];
  weight?: number;
}

const tabsSchema = z.object({
  tabs: z.array(z.object({
    title: annotated(CommonTypes.DynamicString, "The tab title."),
    child: annotated(CommonTypes.ComponentId, "The ID of the child component. Do NOT define the component inline.")
  })).describe("An array of objects, where each object defines a tab with a title and a child component."),
  weight: CatalogCommon.Weight.optional()
});

export class TabsComponent<T> implements Component<T> {
  readonly name = 'Tabs';
  readonly schema = tabsSchema;

  constructor(private readonly renderer: (props: TabsRenderProps<T>, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const tabsProp = properties['tabs'] as any[];
    const tabs: TabItem<T>[] = [];

    if (Array.isArray(tabsProp)) {
      for (const item of tabsProp) {
        const title = context.resolve<string>(item.title ?? '');
        const childId = item.child;
        const child = childId ? context.renderChild(childId) : null;
        tabs.push({ title, child });
      }
    }
    const weight = properties['weight'] as number | undefined;

    return this.renderer({ tabs, weight }, context);
  }
}
