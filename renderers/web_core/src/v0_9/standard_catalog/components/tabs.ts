
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface TabItem<T> {
  title: string;
  child: T | null;
}

export interface TabsRenderProps<T> {
  tabs: TabItem<T>[];
}

export class TabsComponent<T> implements Component<T> {
  readonly name = 'Tabs';

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

    return this.renderer({ tabs }, context);
  }
}
