import { describe, it } from 'node:test';
import { litCard } from './card.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Card', () => {
    it('renders card container', () => {
        const context = createLitTestContext({ child: null });
        const result = litCard.render(context);
        assertTemplateContains(result, 'class="a2ui-card"');
    });
});
