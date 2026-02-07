
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CardComponent } from './card.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { DataContext } from '../../state/data-context.js';
import { SurfaceContext } from '../../state/surface-context.js';

class TestSurfaceContext extends SurfaceContext {
  constructor(actionHandler: any) {
    super('test', {} as any, {}, actionHandler);
  }
}

function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceContext(actionHandler);
  const dataContext = new DataContext(surface.dataModel, '/');
  // Mock renderChild to return the ID as the rendered result for verification
  const context = new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
  context.renderChild = (id: string) => `Rendered(${id})`;
  return context;
}

describe('CardComponent', () => {
  it('renders child', () => {
    const comp = new CardComponent((props) => props);
    const context = createTestContext({ child: 'child-1' });
    const result = comp.render(context) as any;
    assert.strictEqual(result.child, 'Rendered(child-1)');
  });
});
