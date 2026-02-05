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
});
