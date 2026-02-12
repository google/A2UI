import { describe, it } from 'node:test';
import { litModal } from './modal.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Modal', () => {
    it('renders modal wrapper', () => {
        const context = createLitTestContext({ trigger: null, content: null });
        const result = litModal.render(context);
        assertTemplateContains(result, 'a2ui-modal-wrapper-v0-9');
    });
});
