
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TabsComponent } from './tabs.js';
import { ModalComponent } from './modal.js';
import { ListComponent } from './list.js';
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
  const context = new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
  context.renderChild = (id: string) => `Rendered(${id})`;
  return context;
}

describe('Generic Components', () => {
  it('List renders children', () => {
    const comp = new ListComponent((props) => props);
    const context = createTestContext({
      children: { explicitList: ['item-1', 'item-2'] },
      direction: 'horizontal'
    });
    const result = comp.render(context) as any;
    assert.deepStrictEqual(result.children, ['Rendered(item-1)', 'Rendered(item-2)']);
    assert.strictEqual(result.direction, 'horizontal');
  });

  it('Tabs render tab items', () => {
    const comp = new TabsComponent((props) => props);
    const context = createTestContext({
      tabs: [
        { title: 'Tab 1', child: 'child-1' },
        { title: 'Tab 2', child: null }
        // Spec allows null child? ID is usually string. 
        // In our impl we resolve null if ID missing.
      ]
    });
    const result = comp.render(context) as any;
    assert.strictEqual(result.tabs.length, 2);
    assert.strictEqual(result.tabs[0].title, 'Tab 1');
    assert.strictEqual(result.tabs[0].child, 'Rendered(child-1)');
  });

  it('Modal renders trigger and content', () => {
    const comp = new ModalComponent((props) => props);
    const context = createTestContext({
      trigger: 'btn-open',
      content: 'dialog-content'
    });
    const result = comp.render(context) as any;
    assert.strictEqual(result.trigger, 'Rendered(btn-open)');
    assert.strictEqual(result.content, 'Rendered(dialog-content)');
  });
});
