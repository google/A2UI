
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { RowComponent } from './row.js';


import { createTestContext } from '../../test/test-utils.js';

describe('RowComponent', () => {
  it('renders explicit list of children', () => {
    const comp = new RowComponent((props) => props);
    const context = createTestContext({
      children: { explicitList: ['child-1', 'child-2'] },
      justify: 'start'
    });
    const result = comp.render(context) as any;
    assert.strictEqual(result.direction, 'row');
    assert.deepStrictEqual(result.children, ['Rendered(child-1)', 'Rendered(child-2)']);
  });
});
