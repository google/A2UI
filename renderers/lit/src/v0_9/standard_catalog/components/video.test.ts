import { describe, it } from 'node:test';
import { litVideo } from './video.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Video', () => {
    it('renders video element', () => {
        const context = createLitTestContext({ url: 'vid.mp4', showControls: true });
        const result = litVideo.render(context);
        assertTemplateContains(result, '<video');
        assertTemplateContains(result, 'src="vid.mp4"');
    });
});
