
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ChoicePickerComponent } from './choice-picker.js';
import { createTestContext } from '../../test/test-utils.js';

describe('ChoicePickerComponent', () => {
  it('updates data model', () => {
    const comp = new ChoicePickerComponent((props) => props);
    const context = createTestContext({
      value: { path: '/selection' },
      selections: [{ label: 'A', value: 'a' }]
    });

    context.dataContext.update('/selection', ['a']);
    const result = comp.render(context) as any;
    assert.deepStrictEqual(result.value, ['a']);

    result.onChange(['b']);
    assert.deepStrictEqual(context.dataContext.getValue('/selection'), ['b']);
  });
});
