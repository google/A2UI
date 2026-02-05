
import { ComponentContext } from '../../rendering/component-context.js';
import { ContainerComponent, ContainerRenderProps } from '../shared/container-component.js';

export class ColumnComponent<T> extends ContainerComponent<T> {
  constructor(renderer: (props: ContainerRenderProps<T>, context: ComponentContext<T>) => T) {
    super('Column', 'column', renderer);
  }
}
