
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CheckBoxComponent } from './check-box.js';
import { createTestContext } from '../../test/test-utils.js';

describe('CheckBoxComponent', () => {
  it('updates data model', () => {
    const comp = new CheckBoxComponent((props) => props);
    const context = createTestContext({
      label: 'Agree',
      value: { path: '/agreed' }
    });

    context.dataContext.update('/agreed', false);
    context.dataContext.update('/agreed', false);
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, false);

    result.onChange(true);
    assert.strictEqual(context.dataContext.getValue('/agreed'), true);
  });
});
