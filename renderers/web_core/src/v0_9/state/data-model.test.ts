
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

  // --- Basic Retrieval ---

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

  // --- Updates ---

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

  it('removes keys when value is undefined', () => {
    model.set('/user/name', undefined);
    assert.strictEqual(model.get('/user/name'), undefined);
    assert.strictEqual(Object.keys(model.get('/user')).includes('name'), false);
  });

  it('replaces root object on root update', () => {
     model.set('/', { newRoot: true });
     assert.deepStrictEqual(model.get('/'), { newRoot: true });
  });

  // --- Array / List Handling (Flutter Parity) ---

  it('List: set and get', () => {
    model.set('/list/0', 'hello');
    assert.strictEqual(model.get('/list/0'), 'hello');
    assert.ok(Array.isArray(model.get('/list')));
  });

  it('List: append and get', () => {
    model.set('/list/0', 'hello');
    model.set('/list/1', 'world');
    assert.strictEqual(model.get('/list/0'), 'hello');
    assert.strictEqual(model.get('/list/1'), 'world');
    assert.strictEqual(model.get('/list').length, 2);
  });

  it('List: update existing index', () => {
    model.set('/items/1', 'updated');
    assert.strictEqual(model.get('/items/1'), 'updated');
  });

  it('Nested structures are created automatically', () => {
    // Should create nested map and list: { a: { b: [ { c: 123 } ] } }
    model.set('/a/b/0/c', 123);
    assert.strictEqual(model.get('/a/b/0/c'), 123);
    assert.ok(Array.isArray(model.get('/a/b')));
    assert.ok(!Array.isArray(model.get('/a/b/0')));

    // Should create nested maps
    model.set('/x/y/z', 'hello');
    assert.strictEqual(model.get('/x/y/z'), 'hello');

    // Should create nested lists
    model.set('/nestedList/0/0', 'inner');
    assert.strictEqual(model.get('/nestedList/0/0'), 'inner');
    assert.ok(Array.isArray(model.get('/nestedList')));
    assert.ok(Array.isArray(model.get('/nestedList/0')));
  });

  // --- Subscriptions ---

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

  it('notifies ancestor subscribers (Container Semantics)', (_, done) => {
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

  it('notifies parent when child updates', () => {
    model.set('/parent', { child: 'initial' });
    
    const sub = model.subscribe('/parent');
    let parentValue: any;
    sub.onChange = (val) => parentValue = val;
    
    model.set('/parent/child', 'updated');
    assert.deepStrictEqual(parentValue, { child: 'updated' });
  });
  
  it('stops notifying after dispose', () => {
    let count = 0;
    const sub = model.subscribe('/');
    sub.onChange = () => count++;
    
    model.dispose();
    model.set('/foo', 'bar');
    assert.strictEqual(count, 0);
  });
});
