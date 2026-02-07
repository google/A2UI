import { describe, it } from 'node:test';
import { litButton } from './button.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Button', () => {
    it('renders button element', () => {
        const context = createLitTestContext({ label: 'Click Me' });
        const result = litButton.render(context);
        assertTemplateContains(result, '<button');
        assertTemplateContains(result, 'Click Me');
    });

    it('renders child content overrides label', () => {
        const context = createLitTestContext({ label: 'Label', child: 'Custom Content' });
        const result = litButton.render(context);
        assertTemplateContains(result, 'Custom Content');
    });
});
