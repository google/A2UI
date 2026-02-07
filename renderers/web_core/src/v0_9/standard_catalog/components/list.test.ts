
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ListComponent } from './list.js';
import { createTestContext } from '../../test/test-utils.js';

describe('ListComponent', () => {
  it('renders children', () => {
    const comp = new ListComponent((props) => props);
    const context = createTestContext({
      children: { explicitList: ['item-1', 'item-2'] },
      direction: 'horizontal'
    });
    const result = comp.render(context) as any;
    assert.deepStrictEqual(result.children, ['Rendered(item-1)', 'Rendered(item-2)']);
    assert.strictEqual(result.direction, 'horizontal');
  });
});
