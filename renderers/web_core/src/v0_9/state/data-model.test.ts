
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

  it('notifies subscribers on exact match', (_, done) => {
    model.subscribe('/user/name', (val) => {
      assert.strictEqual(val, 'Charlie');
      done();
    });
    model.set('/user/name', 'Charlie');
  });

  it('notifies ancestor subscribers', (_, done) => {
    model.subscribe('/user', (val) => {
      assert.strictEqual(val.name, 'Dave');
      done();
    });
    model.set('/user/name', 'Dave');
  });

  it('notifies descendant subscribers', (_, done) => {
    model.subscribe('/user/settings/theme', (val) => {
      assert.strictEqual(val, 'light');
      done();
    });

    // We update the parent object
    model.set('/user/settings', { theme: 'light' });
  });

  it('notifies root subscriber', (_, done) => {
    model.subscribe('/', (val) => {
      assert.strictEqual(val.newProp, 'test');
      done();
    });
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
});
