import { describe, it } from 'node:test';
import { litList } from './list.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit List', () => {
    it('renders list container', () => {
        const context = createLitTestContext({ children: [], direction: 'vertical' });
        const result = litList.render(context);
        assertTemplateContains(result, 'class="a2ui-list"');
        assertTemplateContains(result, 'flex-direction: column');
    });
});
