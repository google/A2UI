
import { ComponentContext } from '../rendering/component-context.js';
import { SurfaceModel } from '../state/surface-model.js';
import { CatalogApi } from '../catalog/types.js';
import { ComponentModel } from '../state/component-model.js';

export class TestSurfaceModel extends SurfaceModel<CatalogApi> {
  constructor(actionHandler: any = async () => { }) {
    super('test', { id: 'test-catalog', components: new Map() }, {});
    this.addActionListener(actionHandler);
  }
}

export function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceModel(actionHandler);
  const component = new ComponentModel('test-id', 'TestComponent', properties);
  surface.componentsModel.addComponent(component);
  
  const context = new ComponentContext(surface, 'test-id', '/');
  
  return context;
}
