import { describe, it } from 'node:test';
import { litSlider } from './slider.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Slider', () => {
    it('renders slider', () => {
        const context = createLitTestContext({ label: 'Volume', value: 50, min: 0, max: 100 });
        const result = litSlider.render(context);
        assertTemplateContains(result, 'Volume');
        assertTemplateContains(result, 'type="range"');
        assertTemplateContains(result, '50'); // Value display
    });
});
