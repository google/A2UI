
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TabsComponent } from './tabs.js';
import { createTestContext } from '../../test/test-utils.js';

describe('TabsComponent', () => {
  it('render tab items', () => {
    const comp = new TabsComponent((props) => props);
    const context = createTestContext({
      tabs: [
        { title: 'Tab 1', child: 'child-1' },
        { title: 'Tab 2', child: null }
      ]
    });
    const result = comp.render(context) as any;
    assert.strictEqual(result.tabs.length, 2);
    assert.strictEqual(result.tabs[0].title, 'Tab 1');
    assert.strictEqual(result.tabs[0].child, 'Rendered(child-1)');
  });
});
