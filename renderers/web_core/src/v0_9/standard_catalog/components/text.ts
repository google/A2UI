
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface TextRenderProps {
  text: string;
  variant?: string;
  weight?: number;
}

const textSchema = z.object({
  text: annotated(CommonTypes.DynamicString, 'The text content to display. While simple Markdown formatting is supported (i.e. without HTML, images, or links), utilizing dedicated UI components is generally preferred for a richer and more structured presentation.'),
  variant: z.enum(["h1", "h2", "h3", "h4", "h5", "caption", "body"]).optional().describe('A hint for the base text style.'),
  weight: CatalogCommon.Weight.optional()
});

export class TextComponent<T> implements Component<T> {
  readonly name = 'Text';
  readonly schema = textSchema;

  constructor(private readonly renderer: (props: TextRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const text = context.resolve<string>(properties['text'] ?? '');
    const variant = properties['variant'];
    const weight = properties['weight'] as number | undefined;
    
    return this.renderer({ text, variant, weight }, context);
  }
}
