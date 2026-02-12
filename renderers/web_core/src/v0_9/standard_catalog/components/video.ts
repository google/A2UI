
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { z } from 'zod';
import { CommonTypes, annotated } from '../../catalog/schema_types.js';
import { CatalogCommon } from '../schema_shared.js';

export interface VideoRenderProps {
  url: string;
  showControls?: boolean;
  weight?: number;
}

const videoSchema = z.object({
  url: annotated(CommonTypes.DynamicString, "The URL of the video to display."),
  weight: CatalogCommon.Weight.optional()
});

export class VideoComponent<T> implements Component<T> {
  readonly name = 'Video';
  readonly schema = videoSchema;

  constructor(private readonly renderer: (props: VideoRenderProps, context: ComponentContext<T>) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const url = context.resolve<string>(properties['url'] ?? '');
    const showControls = context.resolve<boolean>(properties['showControls'] ?? true);
    const weight = properties['weight'] as number | undefined;

    return this.renderer({ url, showControls, weight }, context);
  }
}
