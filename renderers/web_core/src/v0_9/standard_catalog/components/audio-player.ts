
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';

export interface AudioPlayerRenderProps {
  url: string;
  description?: string;
  weight?: number;
}

const audioPlayerSchema = z.object({
  url: annotated(CommonTypes.DynamicString, "The URL of the audio to be played."),
  description: annotated(CommonTypes.DynamicString, "A description of the audio, such as a title or summary.").optional(),
  weight: CommonTypes.Weight.optional()
});

export class AudioPlayerComponent<T> implements Component<T> {
  readonly name = 'AudioPlayer';
  readonly schema = audioPlayerSchema;

  constructor(private readonly renderer: (props: AudioPlayerRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const url = context.resolve<string>(properties['url'] ?? '');
    const description = context.resolve<string>(properties['description'] ?? '');
    const weight = properties['weight'] as number | undefined;
    
    return this.renderer({ url, description, weight }, context);
  }
}
