
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface ImageRenderProps {
  url: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  variant?: 'icon' | 'avatar' | 'smallFeature' | 'mediumFeature' | 'largeFeature' | 'header';
}

export class ImageComponent<T> implements Component<T> {
  readonly name = 'Image';

  constructor(private readonly renderer: (props: ImageRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const url = context.resolve<string>(properties['url'] ?? '');
    const fit = properties['fit'] as ImageRenderProps['fit'];
    const variant = properties['variant'] as ImageRenderProps['variant'];
    
    return this.renderer({ url, fit, variant }, context);
  }
}
