
import { describe, it } from 'node:test';
import { litColumn } from './column.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Column', () => {
    it('renders column', () => {
        const context = createLitTestContext({ children: [], direction: 'column' });
        const result = litColumn.render(context);
        assertTemplateContains(result, 'display: flex');
        assertTemplateContains(result, 'flex-direction: column');
    });
});
