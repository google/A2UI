import { describe, it } from 'node:test';
import { litChoicePicker } from './choice-picker.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit ChoicePicker', () => {
  it('renders options', () => {
    const context = createLitTestContext({
      label: 'Choose',
      value: ['a'],
      options: [{ label: 'Option A', value: 'a' }, { label: 'Option B', value: 'b' }]
    });
    const result = litChoicePicker.render(context);
    assertTemplateContains(result, 'Choose');
    assertTemplateContains(result, 'Option A');
    assertTemplateContains(result, 'Option B');
  });
});
