import { describe, it } from 'node:test';
import { litIcon } from './icon.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Icon', () => {
    it('renders icon with material class', () => {
        const context = createLitTestContext({ name: 'home' });
        const result = litIcon.render(context);
        assertTemplateContains(result, 'material-icons');
        assertTemplateContains(result, 'home');
    });
});
