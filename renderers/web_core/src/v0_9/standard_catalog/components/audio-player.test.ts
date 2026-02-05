
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { AudioPlayerComponent } from './audio-player.js';
import { createTestContext } from '../../test/test-utils.js';

describe('AudioPlayerComponent', () => {
  it('renders url', () => {
    const comp = new AudioPlayerComponent((props) => props);
    const context = createTestContext({ url: 'audio.mp3' });
    const result = comp.render(context) as any;
    assert.strictEqual(result.url, 'audio.mp3');
  });
});
