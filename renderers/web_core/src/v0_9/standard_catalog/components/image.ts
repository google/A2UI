
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface ImageRenderProps {
  url: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  variant?: 'icon' | 'avatar' | 'smallFeature' | 'mediumFeature' | 'largeFeature' | 'header';
}

const imageSchema = z.object({
  url: annotated(CommonTypes.DynamicString, "The URL of the image to display."),
  fit: z.enum(["contain", "cover", "fill", "none", "scale-down"]).optional().describe("Specifies how the image should be resized to fit its container. This corresponds to the CSS 'object-fit' property."),
  variant: z.enum(["icon", "avatar", "smallFeature", "mediumFeature", "largeFeature", "header"]).optional().describe("A hint for the image size and style.")
});

export class ImageComponent<T> implements Component<T> {
  readonly name = 'Image';
  readonly schema = imageSchema;

  constructor(private readonly renderer: (props: ImageRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const url = context.resolve<string>(properties['url'] ?? '');
    const fit = properties['fit'] as ImageRenderProps['fit'];
    const variant = properties['variant'] as ImageRenderProps['variant'];
    
    return this.renderer({ url, fit, variant }, context);
  }
}
