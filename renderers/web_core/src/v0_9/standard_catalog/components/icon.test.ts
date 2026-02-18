
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { IconComponent } from './icon.js';
import { createTestContext } from '../../test/test-utils.js';

describe('IconComponent', () => {
  it('renders name (string)', () => {
    const comp = new IconComponent((props) => props);
    const context = createTestContext({ name: 'home' });
    const result = comp.render(context) as any;
    assert.strictEqual(result.name, 'home');
  });

  it('renders name (object)', () => {
    const comp = new IconComponent((props) => props);
    const context = createTestContext({ name: { icon: 'home', font: 'Material' } });
    const result = comp.render(context) as any;
    assert.deepStrictEqual(result.name, { icon: 'home', font: 'Material' });
  });
});
