import assert from 'node:assert';
import { test, describe, it, beforeEach } from 'node:test';
import { DataModel } from './data-model.js';

describe('DataModel', () => {
  let model: DataModel;

  beforeEach(() => {
    model = new DataModel({
      user: {
        name: 'Alice',
        settings: {
          theme: 'dark'
        }
      },
      items: ['a', 'b', 'c']
    });
  });

  it('retrieves root data', () => {
    assert.deepStrictEqual(model.get('/'), { user: { name: 'Alice', settings: { theme: 'dark' } }, items: ['a', 'b', 'c'] });
  });

  it('retrieves nested path', () => {
    assert.strictEqual(model.get('/user/name'), 'Alice');
    assert.strictEqual(model.get('/user/settings/theme'), 'dark');
  });

  it('retrieves array items', () => {
    assert.strictEqual(model.get('/items/0'), 'a');
    assert.strictEqual(model.get('/items/1'), 'b');
  });

  it('returns undefined for non-existent paths', () => {
    assert.strictEqual(model.get('/user/age'), undefined);
    assert.strictEqual(model.get('/unknown/path'), undefined);
  });

  it('sets value at existing path', () => {
    model.set('/user/name', 'Bob');
    assert.strictEqual(model.get('/user/name'), 'Bob');
  });

  it('sets value at new path', () => {
    model.set('/user/age', 30);
    assert.strictEqual(model.get('/user/age'), 30);
  });

  it('creates intermediate objects', () => {
    model.set('/a/b/c', 'foo');
    assert.strictEqual(model.get('/a/b/c'), 'foo');
    assert.notStrictEqual(model.get('/a/b'), undefined);
  });

  it('returns a subscription object', () => {
    model.set('/a', 1);
    const sub = model.subscribe<number>('/a');
    assert.strictEqual(sub.value, 1);
    
    let updatedValue: number | undefined;
    sub.onChange = (val) => updatedValue = val;
  
    model.set('/a', 2);
    assert.strictEqual(sub.value, 2);
    assert.strictEqual(updatedValue, 2);
    
    sub.unsubscribe();
    // Verify listener removed
    model.set('/a', 3);
    assert.strictEqual(updatedValue, 2);
  });

  it('notifies subscribers on exact match', (_, done) => {
    const sub = model.subscribe('/user/name');
    sub.onChange = (val) => {
      assert.strictEqual(val, 'Charlie');
      done();
    };
    model.set('/user/name', 'Charlie');
  });

  it('notifies ancestor subscribers', (_, done) => {
    const sub = model.subscribe('/user');
    sub.onChange = (val: any) => {
      assert.strictEqual(val.name, 'Dave');
      done();
    };
    model.set('/user/name', 'Dave');
  });

  it('notifies descendant subscribers', (_, done) => {
    const sub = model.subscribe('/user/settings/theme');
    sub.onChange = (val) => {
      assert.strictEqual(val, 'light');
      done();
    };

    // We update the parent object
    model.set('/user/settings', { theme: 'light' });
  });

  it('notifies root subscriber', (_, done) => {
    const sub = model.subscribe('/');
    sub.onChange = (val: any) => {
      assert.strictEqual(val.newProp, 'test');
      done();
    };
    model.set('/newProp', 'test');
  });

  it('handles array updates', () => {
    model.set('/items/1', 'updated');
    assert.strictEqual(model.get('/items/1'), 'updated');
  });

  it('removes keys when value is undefined', () => {
    model.set('/user/name', undefined);
    assert.strictEqual(model.get('/user/name'), undefined);
    assert.strictEqual(Object.keys(model.get('/user')).includes('name'), false);
  });

  it('notifies parent when child updates', () => {
    model.set('/parent', { child: 'initial' });
    
    const sub = model.subscribe('/parent');
    let parentValue: any;
    sub.onChange = (val) => parentValue = val;
    
    model.set('/parent/child', 'updated');
    assert.deepStrictEqual(parentValue, { child: 'updated' });
  });
  
  it('creates intermediate arrays for numeric segments', () => {
    model.set('/users/0/name', 'Alice');
    assert.ok(Array.isArray(model.get('/users')));
    assert.strictEqual(model.get('/users/0/name'), 'Alice');
  });
  
  it('stops notifying after dispose', () => {
    let count = 0;
    const sub = model.subscribe('/');
    sub.onChange = () => count++;
    
    model.dispose();
    model.set('/foo', 'bar');
    assert.strictEqual(count, 0);
  });
  
  it('replaces root object on root update', () => {
     model.set('/', { newRoot: true });
     assert.deepStrictEqual(model.get('/'), { newRoot: true });
  });
});
