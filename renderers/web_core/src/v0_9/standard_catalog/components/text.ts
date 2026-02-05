
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface TextRenderProps {
  text: string;
}

export class TextComponent<T> implements Component<T> {
  readonly name = 'Text';

  constructor(private readonly renderer: (props: TextRenderProps) => T) {}

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const text = context.resolve<string>(properties['text'] ?? '');
    
    return this.renderer({ text });
  }
}
