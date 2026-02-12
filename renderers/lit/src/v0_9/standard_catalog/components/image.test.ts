import { describe, it } from 'node:test';
import { litImage } from './image.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Image', () => {
    it('renders image element', () => {
        const context = createLitTestContext({ url: 'img.png' });
        const result = litImage.render(context);
        assertTemplateContains(result, '<img');
        assertTemplateContains(result, 'src="img.png"');
    });
});
