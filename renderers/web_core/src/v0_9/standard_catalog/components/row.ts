
import { ComponentContext } from '../../rendering/component-context.js';
import { ContainerComponent, ContainerRenderProps } from '../shared/container-component.js';

export class RowComponent<T> extends ContainerComponent<T> {
  constructor(renderer: (props: ContainerRenderProps<T>, context: ComponentContext<T>) => T) {
    super('Row', 'row', renderer);
  }
}
