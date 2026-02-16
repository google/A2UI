
import { ComponentContext } from '../rendering/component-context.js';
import { DataContext } from '../state/data-context.js';
import { SurfaceContext } from '../state/surface-context.js';

export class TestSurfaceContext extends SurfaceContext {
  constructor(actionHandler: any = async () => { }) {
    super('test', {} as any, {}, actionHandler);
  }
}

export function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceContext(actionHandler);
  const dataContext = new DataContext(surface.dataModel, '/');
  const context = new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
  context.renderChild = (id: string) => `Rendered(${id})`;
  return context;
}
