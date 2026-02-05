
import { describe, it } from 'node:test';
import { litRow } from './row.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Row', () => {
    it('renders row', () => {
        const context = createLitTestContext({ children: [], direction: 'row' });
        const result = litRow.render(context);
        assertTemplateContains(result, 'flex-direction: row');
    });
});
