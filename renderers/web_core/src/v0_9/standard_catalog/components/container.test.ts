
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ContainerComponent } from './container.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { DataContext } from '../../state/data-context.js';
import { SurfaceContext } from '../../state/surface-context.js';

class TestSurfaceContext extends SurfaceContext {
  constructor() {
    super('test', {} as any, {}, async () => { });
  }
}

function createTestContext(properties: any, surface: SurfaceContext) {
  const dataContext = new DataContext(surface.dataModel, '/');
  const context = new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
  context.renderChild = (id: string) => `Rendered(${id})`;
  return context;
}

describe('ContainerComponent', () => {
  it('renders explicit list of children (Row)', () => {
    const comp = new ContainerComponent('Row', 'row', (props) => props);
    const surface = new TestSurfaceContext();
    const context = createTestContext({
      children: { explicitList: ['child-1', 'child-2'] },
      justify: 'start'
    }, surface);
    const result = comp.render(context) as any;
    assert.strictEqual(result.direction, 'row');
    assert.deepStrictEqual(result.children, ['Rendered(child-1)', 'Rendered(child-2)']);
  });

  it('renders explicit list of children (Column)', () => {
    const comp = new ContainerComponent('Column', 'column', (props) => props);
    const surface = new TestSurfaceContext();
    const context = createTestContext({
      children: { explicitList: ['child-A'] }
    }, surface);
    const result = comp.render(context) as any;
    assert.strictEqual(result.direction, 'column');
    assert.deepStrictEqual(result.children, ['Rendered(child-A)']);
  });
});
