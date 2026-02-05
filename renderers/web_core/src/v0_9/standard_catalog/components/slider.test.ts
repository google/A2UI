
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { SliderComponent } from './slider.js';
import { createTestContext } from '../../test/test-utils.js';

describe('SliderComponent', () => {
  it('updates data model', () => {
    const comp = new SliderComponent((props) => props);
    const context = createTestContext({
      value: { path: '/volume' },
      min: 0, max: 100
    });

    context.dataContext.update('/volume', 50);
    context.dataContext.update('/volume', 50);
    const result = comp.render(context) as any;
    assert.strictEqual(result.value, 50);

    result.onChange(75);
    assert.strictEqual(context.dataContext.getValue('/volume'), 75);
  });
});
