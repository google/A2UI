import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { ComponentsModel } from './components-model.js';
import { ComponentModel } from './component-model.js';

describe('ComponentsModel', () => {
  let model: ComponentsModel;

  beforeEach(() => {
    model = new ComponentsModel();
  });

  it('starts empty', () => {
    assert.strictEqual(model.get('any'), undefined);
  });

  it('creates a new component', () => {
    model.createComponent('c1', 'Button', { label: 'Click' });
    const c1 = model.get('c1');
    assert.ok(c1);
    assert.strictEqual(c1?.id, 'c1');
    assert.strictEqual(c1?.type, 'Button');
    assert.strictEqual(c1?.properties.label, 'Click');
  });

  it('updates an existing component', () => {
    const c1 = model.createComponent('c1', 'Button', { label: 'Initial' });
    
    // Track update on component itself
    let updateCount = 0;
    c1.addUpdateListener({
      onComponentUpdated: () => updateCount++
    });

    c1.update({ label: 'Updated' });
    
    assert.strictEqual(c1.properties.label, 'Updated');
    assert.strictEqual(updateCount, 1);
  });

  it('notifies on component creation', () => {
    let createdComponent: ComponentModel | undefined;
    model.addLifecycleListener({
      onComponentCreated: (c) => {
        createdComponent = c;
      }
    });

    model.createComponent('c1', 'Button', {});
    assert.ok(createdComponent);
    assert.strictEqual(createdComponent?.id, 'c1');
  });

  it('throws when creating duplicate component', () => {
    model.createComponent('c1', 'Button', {});
    assert.throws(() => {
        model.createComponent('c1', 'Button', {});
    }, /already exists/);
  });
});
