import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { ExpressionEvaluator, EvaluationContext } from './expression_evaluator.js';

describe('ExpressionEvaluator', () => {
  let evaluator: ExpressionEvaluator;
  let context: EvaluationContext;
  let dataModel: Map<string, any>;

  beforeEach(() => {
    evaluator = new ExpressionEvaluator();
    dataModel = new Map();
    dataModel.set('user', { name: 'Alice', age: 30 });
    dataModel.set('items', ['a', 'b']);

    context = {
      resolveData: (path: string) => {
        if (path === '/user/name') return dataModel.get('user').name;
        if (path === '/user/age') return dataModel.get('user').age;
        if (path === '/items') return dataModel.get('items');
        return undefined;
      },
    };
  });

  it('evaluates primitives as themselves', () => {
    assert.strictEqual(evaluator.evaluate(123, context), 123);
    assert.strictEqual(evaluator.evaluate('hello', context), 'hello');
    assert.strictEqual(evaluator.evaluate(true, context), true);
    assert.strictEqual(evaluator.evaluate(null, context), null);
  });

  it('evaluates primitive wrappers', () => {
    assert.strictEqual(evaluator.evaluate({ literal: 'foo' }, context), 'foo');
    assert.strictEqual(evaluator.evaluate({ literalString: 'bar' }, context), 'bar');
    assert.strictEqual(evaluator.evaluate({ literalNumber: 42 }, context), 42);
    assert.strictEqual(evaluator.evaluate({ literalBoolean: false }, context), false);
  });

  it('evaluates data bindings', () => {
    assert.strictEqual(evaluator.evaluate({ path: '/user/name' }, context), 'Alice');
    assert.strictEqual(evaluator.evaluate({ path: '/user/age' }, context), 30);
    assert.deepStrictEqual(evaluator.evaluate({ path: '/items' }, context), ['a', 'b']);
    assert.strictEqual(evaluator.evaluate({ path: '/nonexistent' }, context), undefined);
  });

  it('evaluates function calls', () => {
    evaluator.registerFunction('add', (args) => (args['a'] as number) + (args['b'] as number));

    // Call with primitives
    const result = evaluator.evaluate({
      call: 'add',
      args: { a: 10, b: 20 }
    }, context);
    assert.strictEqual(result, 30);

    // Call with nested evaluations (wrappers)
    const result2 = evaluator.evaluate({
      call: 'add',
      args: {
        a: { literalNumber: 5 },
        b: { literalNumber: 7 }
      }
    }, context);
    assert.strictEqual(result2, 12);
  });

  it('evaluates dependent function calls (nested calls)', () => {
    evaluator.registerFunction('add', (args) => (args['a'] as number) + (args['b'] as number));
    evaluator.registerFunction('multiply', (args) => (args['a'] as number) * (args['b'] as number));

    // multiply(add(2, 3), 4) = (2+3)*4 = 20
    const result = evaluator.evaluate({
      call: 'multiply',
      args: {
        a: {
          call: 'add',
          args: { a: 2, b: 3 }
        },
        b: 4
      }
    }, context);

    assert.strictEqual(result, 20);
  });

  it('handles unknown functions gracefully', () => {
    const result = evaluator.evaluate({
      call: 'unknown_function',
      args: {}
    }, context);
    // Based on implementation viewed earlier, it logs warn and returns null
    assert.strictEqual(result, null);
  });
});
