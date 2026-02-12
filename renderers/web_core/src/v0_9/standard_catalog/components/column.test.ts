
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ColumnComponent } from './column.js';


import { createTestContext } from '../../test/test-utils.js';

describe('ColumnComponent', () => {
  it('renders explicit list of children', () => {
    const comp = new ColumnComponent((props) => props);
    const context = createTestContext({
      children: { explicitList: ['child-A'] }
    });
    const result = comp.render(context) as any;
    assert.strictEqual(result.direction, 'column');
    assert.deepStrictEqual(result.children, ['Rendered(child-A)']);
  });
});
