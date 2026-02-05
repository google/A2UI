
import { ContainerComponent, ContainerRenderProps } from '../shared/container-component.js';

export class RowComponent<T> extends ContainerComponent<T> {
  constructor(renderer: (props: ContainerRenderProps<T>) => T) {
    super('Row', 'row', renderer);
  }
}
