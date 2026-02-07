
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TextComponent } from './text.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { DataContext } from '../../state/data-context.js';
import { SurfaceContext } from '../../state/surface-context.js';

// Mock SurfaceContext
class TestSurfaceContext extends SurfaceContext {
  constructor(actionHandler: any) {
    super('test', {} as any, {}, actionHandler);
  }
}

function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceContext(actionHandler);
  const dataContext = new DataContext(surface.dataModel, '/');
  return new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
}

describe('TextComponent', () => {
  it('renders text property', () => {
    const comp = new TextComponent((props) => props);
    const context = createTestContext({ text: 'Hello' });
    const result = comp.render(context);
    assert.strictEqual((result as any).text, 'Hello');
  });

  it('resolves dynamic text', () => {
    const comp = new TextComponent((props) => props);
    const context = createTestContext({ text: { path: '/msg' } });
    context.dataContext.update('/msg', 'Dynamic World');
    const result = comp.render(context);
    assert.strictEqual((result as any).text, 'Dynamic World');
  });
});
