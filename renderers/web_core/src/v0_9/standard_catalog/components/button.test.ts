
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ButtonComponent } from './button.js';
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
  return new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
}

describe('ButtonComponent', () => {
  it('renders label and handles action', async () => {
    let actionDispatched: any = null;
    const comp = new ButtonComponent((props) => props);
    const context = createTestContext(
      { label: 'Click Me', action: { type: 'submit' } },
      async (a: any) => { actionDispatched = a; }
    );

    const result = comp.render(context);
    assert.strictEqual((result as any).label, 'Click Me');
    assert.strictEqual((result as any).disabled, false);

    (result as any).onAction();
    assert.deepStrictEqual(actionDispatched, { type: 'submit' });
  });

  it('does not dispatch when disabled', async () => {
    let actionDispatched: any = null;
    const comp = new ButtonComponent((props) => props);
    const context = createTestContext(
      { label: 'Click Me', action: { type: 'submit' }, disabled: true },
      async (a: any) => { actionDispatched = a; }
    );

    const result = comp.render(context);
    assert.strictEqual((result as any).disabled, true);

    (result as any).onAction();
    assert.strictEqual(actionDispatched, null);
  });
});
