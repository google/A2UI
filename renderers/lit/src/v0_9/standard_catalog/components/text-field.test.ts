import { describe, it } from 'node:test';
import { litTextField } from './text-field.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit TextField', () => {
  it('renders label and input', () => {
    const context = createLitTestContext({ label: 'Username', value: 'john' });
    const result = litTextField.render(context);
    assertTemplateContains(result, 'Username');
    assertTemplateContains(result, 'type="text"');
  });

  it('renders password type', () => {
    const context = createLitTestContext({ label: 'Password', value: '', variant: 'obscured' });
    const result = litTextField.render(context);
    assertTemplateContains(result, 'type="password"');
  });
});
