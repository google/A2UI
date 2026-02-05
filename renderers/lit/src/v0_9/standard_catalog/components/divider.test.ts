import { describe, it } from 'node:test';
import { litDivider } from './divider.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Divider', () => {
    it('renders hr element', () => {
        const context = createLitTestContext({});
        const result = litDivider.render(context);
        assertTemplateContains(result, '<hr');
        assertTemplateContains(result, 'class="a2ui-divider"');
    });
});
