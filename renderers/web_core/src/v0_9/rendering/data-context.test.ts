import assert from 'node:assert';
import { test, describe, it, beforeEach } from 'node:test';
import { DataModel } from '../state/data-model.js';
import { DataContext } from './data-context.js';

describe('DataContext', () => {
  let model: DataModel;
  let context: DataContext;

  beforeEach(() => {
    model = new DataModel({
      user: {
        name: 'Alice',
        address: {
          city: 'Wonderland'
        }
      },
      list: ['a', 'b']
    });
    context = new DataContext(model, '/user');
  });

  it('resolves relative paths', () => {
    assert.strictEqual(context.resolveDynamicValue({ path: 'name' }), 'Alice');
  });

  it('resolves absolute paths', () => {
    assert.strictEqual(context.resolveDynamicValue({ path: '/list/0' }), 'a');
  });

  it('resolves nested paths', () => {
    assert.strictEqual(context.resolveDynamicValue({ path: 'address/city' }), 'Wonderland');
  });

  it('updates data via relative path', () => {
    context.set('name', 'Bob');
    assert.strictEqual(model.get('/user/name'), 'Bob');
  });

  it('creates nested context', () => {
    const addressContext = context.nested('address');
    assert.strictEqual(addressContext.path, '/user/address');
    assert.strictEqual(addressContext.resolveDynamicValue({ path: 'city' }), 'Wonderland');
  });

  it('handles root context', () => {
    const rootContext = new DataContext(model, '/');
    assert.strictEqual(rootContext.resolveDynamicValue({ path: 'user/name' }), 'Alice');
  });

  it('subscribes relative path', (_, done) => {
    const sub = context.subscribeDynamicValue({ path: 'name' });
    sub.onChange = (val) => {
      assert.strictEqual(val, 'Charlie');
      done();
    };
    context.set('name', 'Charlie');
  });

  it('resolves using resolveDynamicValue() method with literals', () => {
    // Literal
    assert.strictEqual(context.resolveDynamicValue('literal'), 'literal');
    
    // Path
    assert.strictEqual(context.resolveDynamicValue({ path: 'name' }), 'Alice');
    
    // Absolute Path
    assert.strictEqual(context.resolveDynamicValue({ path: '/list/0' }), 'a');
  });
});
