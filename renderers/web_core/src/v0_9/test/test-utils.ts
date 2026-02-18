
import { ComponentContext } from '../rendering/component-context.js';
import { DataContext } from '../rendering/data-context.js';
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
  const dataContext = new DataContext(surface.dataModel, '/');
  const component = new ComponentModel('test-id', 'TestComponent', properties);
  
  const context = new ComponentContext(component, dataContext, (action) => surface.dispatchAction(action));
  
  return context;
}
