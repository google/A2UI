
import { ComponentContext } from '../rendering/component-context.js';
import { SurfaceModel } from '../state/surface-model.js';
import { Catalog, ComponentApi } from '../catalog/types.js';
import { ComponentModel } from '../state/component-model.js';

export class TestSurfaceModel extends SurfaceModel<ComponentApi> {
  constructor(actionHandler: any = async () => { }) {
    super('test', new Catalog('test-catalog', []), {});
    this.onAction.subscribe(actionHandler);
  }
}

export function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceModel(actionHandler);
  const component = new ComponentModel('test-id', 'TestComponent', properties);
  surface.componentsModel.addComponent(component);

  const context = new ComponentContext(surface, 'test-id', '/');

  return context;
}
