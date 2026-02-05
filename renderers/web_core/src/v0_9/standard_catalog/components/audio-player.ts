
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface AudioPlayerRenderProps {
  url: string;
  description?: string;
}

export class AudioPlayerComponent<T> implements Component<T> {
  readonly name = 'AudioPlayer';

  constructor(private readonly renderer: (props: AudioPlayerRenderProps) => T) {}

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const url = context.resolve<string>(properties['url'] ?? '');
    const description = context.resolve<string>(properties['description'] ?? '');
    
    return this.renderer({ url, description });
  }
}
