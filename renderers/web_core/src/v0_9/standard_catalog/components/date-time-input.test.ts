
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { DateTimeInputComponent } from './date-time-input.js';
import { createTestContext } from '../../test/test-utils.js';

describe('DateTimeInputComponent', () => {
  it('updates data model', () => {
    const comp = new DateTimeInputComponent((props) => props);
    const context = createTestContext({
      value: { path: '/date' }
    });

    context.dataContext.update('/date', '2023-01-01');
    context.dataContext.update('/date', '2023-01-01');
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, '2023-01-01');

    result.onChange('2023-12-31');
    assert.strictEqual(context.dataContext.getValue('/date'), '2023-12-31');
  });
});
