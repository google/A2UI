
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { IconComponent } from './icon.js';
import { VideoComponent } from './video.js';
import { AudioPlayerComponent } from './audio-player.js';
import { DividerComponent } from './divider.js';
import { ComponentContext } from '../../rendering/component-context.js';
import { DataContext } from '../../state/data-context.js';
import { SurfaceContext } from '../../state/surface-context.js';

class TestSurfaceContext extends SurfaceContext {
  constructor(actionHandler: any) {
    super('test', {} as any, {}, actionHandler);
  }
}

function createTestContext(properties: any, actionHandler: any = async () => { }) {
  const surface = new TestSurfaceContext(actionHandler);
  const dataContext = new DataContext(surface.dataModel, '/');
  return new ComponentContext<any>('test-id', properties, dataContext, surface, () => { });
}

describe('MediaComponents', () => {
  it('Icon renders name (string)', () => {
    const comp = new IconComponent((props) => props);
    const context = createTestContext({ name: 'home' });
    const result = comp.render(context) as any;
    assert.strictEqual(result.name, 'home');
  });

  it('Icon renders name (object)', () => {
    const comp = new IconComponent((props) => props);
    const context = createTestContext({ name: { icon: 'home', font: 'Material' } });
    const result = comp.render(context) as any;
    assert.deepStrictEqual(result.name, { icon: 'home', font: 'Material' });
  });

  it('Video renders url and controls', () => {
    const comp = new VideoComponent((props) => props);
    const context = createTestContext({ url: 'vid.mp4', showControls: true });
    const result = comp.render(context) as any;
    assert.strictEqual(result.url, 'vid.mp4');
    assert.strictEqual(result.showControls, true);
  });

  it('AudioPlayer renders url', () => {
    const comp = new AudioPlayerComponent((props) => props);
    const context = createTestContext({ url: 'audio.mp3' });
    const result = comp.render(context) as any;
    assert.strictEqual(result.url, 'audio.mp3');
  });

  it('Divider renders', () => {
    const comp = new DividerComponent((props) => props);
    // Divider usually has no required props, maybe layout props
    const context = createTestContext({});
    const result = comp.render(context);
    assert.ok(result);
  });
});
