
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DividerComponent } from './divider.js';
import { createTestContext } from '../../test/test-utils.js';

describe('DividerComponent', () => {
  it('renders', () => {
    const comp = new DividerComponent((props) => props);
    const context = createTestContext({});
    const result = comp.render(context);
    assert.ok(result);
  });
});
