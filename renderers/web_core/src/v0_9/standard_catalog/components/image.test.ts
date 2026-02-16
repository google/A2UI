
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ImageComponent } from './image.js';
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

describe('ImageComponent', () => {
  it('renders with url and properties', () => {
    const comp = new ImageComponent((props) => props);
    const context = createTestContext({
      url: 'http://example.com/img.png',
      fit: 'cover',
      variant: 'avatar'
    });
    const result = comp.render(context);
    assert.strictEqual(result.url, 'http://example.com/img.png');
    assert.strictEqual(result.fit, 'cover');
    assert.strictEqual(result.variant, 'avatar');
  });
});
