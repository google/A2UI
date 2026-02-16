
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface ModalRenderProps<T> {
  trigger: T | null;
  content: T | null;
  weight?: number;
}

const modalSchema = z.object({
  trigger: annotated(CommonTypes.ComponentId, "The ID of the component that opens the modal when interacted with (e.g., a button). Do NOT define the component inline."),
  content: annotated(CommonTypes.ComponentId, "The ID of the component to be displayed inside the modal. Do NOT define the component inline."),
  weight: CatalogCommon.Weight.optional()
});

export class ModalComponent<T> implements Component<T> {
  readonly name = 'Modal';
  readonly schema = modalSchema;

  constructor(private readonly renderer: (props: ModalRenderProps<T>, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const triggerId = properties['trigger'];
    const contentId = properties['content'];

    const trigger = triggerId ? context.renderChild(triggerId) : null;
    const content = contentId ? context.renderChild(contentId) : null;
    const weight = properties['weight'] as number | undefined;

    return this.renderer({ trigger, content, weight }, context);
  }
}
