
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { TextFieldComponent } from './text-field.js';
import { createTestContext } from '../../test/test-utils.js';

describe('TextFieldComponent', () => {
  it('updates data model', () => {
    const comp = new TextFieldComponent((props) => props);
    const context = createTestContext({
      label: 'Name',
      value: { path: '/user/name' }
    });

    // Initial render
    context.dataContext.update('/user/name', 'Alice');
    context.dataContext.update('/user/name', 'Alice'); // Double update to ensure stream ? (copied from original)
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, 'Alice');

    // Simulate change
    result.onChange('Bob');
    assert.strictEqual(context.dataContext.getValue('/user/name'), 'Bob');
  });
});
