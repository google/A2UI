
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface ModalRenderProps<T> {
  trigger: T | null;
  content: T | null;
}

export class ModalComponent<T> implements Component<T> {
  readonly name = 'Modal';

  constructor(private readonly renderer: (props: ModalRenderProps<T>) => T) {}

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const triggerId = properties['trigger'];
    const contentId = properties['content'];

    const trigger = triggerId ? context.renderChild(triggerId) : null;
    const content = contentId ? context.renderChild(contentId) : null;

    return this.renderer({ trigger, content });
  }
}
