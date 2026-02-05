
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface VideoRenderProps {
  url: string;
  showControls?: boolean;
}

export class VideoComponent<T> implements Component<T> {
  readonly name = 'Video';

  constructor(private readonly renderer: (props: VideoRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const url = context.resolve<string>(properties['url'] ?? '');
    const showControls = context.resolve<boolean>(properties['showControls'] ?? true);

    return this.renderer({ url, showControls }, context);
  }
}
