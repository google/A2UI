
import { Component } from '../../catalog/types.js';
import { ComponentContext } from '../../rendering/component-context.js';

export interface IconRenderProps {
  name: string | any; // Supports string name, { icon, font }, or { path }
}

export class IconComponent<T> implements Component<T> {
  readonly name = 'Icon';

  constructor(private readonly renderer: (props: IconRenderProps) => T) { }

  render(context: ComponentContext<T>): T {
    const { properties } = context;
    const nameProp = properties['name'];
    let name: any = '';

    if (typeof nameProp === 'string') {
      name = nameProp; // Can be dynamic resolution later if needed
    } else if (typeof nameProp === 'object') {
      name = nameProp; // Pass through object (e.g. { icon, font } or { path })
    }

    return this.renderer({ name });
  }
}
