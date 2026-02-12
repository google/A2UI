
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ModalComponent } from './modal.js';
import { createTestContext } from '../../test/test-utils.js';

describe('ModalComponent', () => {
  it('renders trigger and content', () => {
    const comp = new ModalComponent((props) => props);
    const context = createTestContext({
      trigger: 'btn-open',
      content: 'dialog-content'
    });
    const result = comp.render(context) as any;
    assert.strictEqual(result.trigger, 'Rendered(btn-open)');
    assert.strictEqual(result.content, 'Rendered(dialog-content)');
  });
});
