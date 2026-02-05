import { describe, it } from 'node:test';
import { litAudioPlayer } from './audio-player.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit AudioPlayer', () => {
    it('renders audio element', () => {
        const context = createLitTestContext({ url: 'audio.mp3' });
        const result = litAudioPlayer.render(context);
        assertTemplateContains(result, '<audio');
        assertTemplateContains(result, 'src="audio.mp3"');
    });
});
