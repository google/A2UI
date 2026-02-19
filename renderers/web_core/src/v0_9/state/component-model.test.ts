import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { ComponentModel } from './component-model.js';

describe('ComponentModel', () => {
  let component: ComponentModel;

  beforeEach(() => {
    component = new ComponentModel('c1', 'Button', { label: 'Click Me', accessibility: { label: 'A11y Label' } });
  });

  it('initializes properties', () => {
    assert.strictEqual(component.id, 'c1');
    assert.strictEqual(component.type, 'Button');
    assert.strictEqual(component.properties.label, 'Click Me');
  });

  it('accesses accessibility properties', () => {
    assert.strictEqual(component.accessibility?.label, 'A11y Label');
  });

  it('updates properties', () => {
    component.update({ label: 'Clicked' });
    assert.strictEqual(component.properties.label, 'Clicked');
  });

  it('notifies listeners on update', () => {
    let updatedComponent: ComponentModel | undefined;
    const listener = {
      onComponentUpdated: (c: ComponentModel) => {
        updatedComponent = c;
      }
    };
    
    component.addUpdateListener(listener);
    component.update({ label: 'New' });
    
    assert.strictEqual(updatedComponent, component);
    assert.strictEqual(updatedComponent?.properties.label, 'New');
  });

  it('unsubscribes listeners', () => {
    let callCount = 0;
    const listener = {
      onComponentUpdated: () => {
        callCount++;
      }
    };
    
    const unsubscribe = component.addUpdateListener(listener);
    component.update({ label: '1' });
    assert.strictEqual(callCount, 1);
    
    unsubscribe();
    component.update({ label: '2' });
    assert.strictEqual(callCount, 1);
  });
});
