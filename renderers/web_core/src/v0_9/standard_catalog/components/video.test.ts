
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { VideoComponent } from './video.js';
import { createTestContext } from '../../test/test-utils.js';

describe('VideoComponent', () => {
  it('renders url and controls', () => {
    const comp = new VideoComponent((props) => props);
    const context = createTestContext({ url: 'vid.mp4', showControls: true });
    const result = comp.render(context) as any;
    assert.strictEqual(result.url, 'vid.mp4');
    assert.strictEqual(result.showControls, true);
  });
});
