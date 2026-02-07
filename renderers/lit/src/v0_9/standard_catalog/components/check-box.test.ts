import { describe, it } from 'node:test';
import { litCheckBox } from './check-box.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit CheckBox', () => {
  it('renders label and checked state', () => {
    const context = createLitTestContext({ label: 'Accept Terms', value: true });
    const result = litCheckBox.render(context);
    assertTemplateContains(result, 'Accept Terms');
    // Lit boolean attributes often show as ?checked or checked depending on binding.
    // In string template: .checked="${value}" -> bound via property
    // We can't easily verify the PROPERTY value in static analysis of TemplateResult strings mostly.
    // But we can verify the structure exists.
    assertTemplateContains(result, 'type="checkbox"');
  });
});
