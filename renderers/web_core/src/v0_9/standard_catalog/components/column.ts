
import { ContainerComponent, ContainerRenderProps } from '../shared/container-component.js';

export class ColumnComponent<T> extends ContainerComponent<T> {
  constructor(renderer: (props: ContainerRenderProps<T>) => T) {
    super('Column', 'column', renderer);
  }
}
