import { describe, it } from 'node:test';
import { litText } from './text.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Text', () => {
    it('renders text content', () => {
        const context = createLitTestContext({ text: 'Hello World' });
        const result = litText.render(context);
        assertTemplateContains(result, 'Hello World');
    });
});
