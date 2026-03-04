import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { ExpressionParser, ParserDataContext } from './expression_parser.js';
import { ExpressionEvaluator, EvaluationContext } from './expression_evaluator.js';
import { Observable, of } from 'rxjs';

class MockDataContext implements ParserDataContext {
  private data: Record<string, any> = {};

  constructor(data: Record<string, any> = {}) {
    this.data = data;
  }

  getValue(path: string): any {
    return this.data[path];
  }

  observe(path: string): Observable<any> {
    return of(this.data[path]);
  }
}

class MockEvaluator extends ExpressionEvaluator {
  evaluate(expr: { call: string; args: Record<string, unknown> }, _context: EvaluationContext): any {
    if (expr.call === 'add') {
      return (Number(expr.args['a']) || 0) + (Number(expr.args['b']) || 0);
    }
    if (expr.call === 'upper') {
      return String(expr.args['text'] || '').toUpperCase();
    }
    return null;
  }
}

describe('ExpressionParser', () => {
  let parser: ExpressionParser;
  let context: MockDataContext;
  let evaluator: MockEvaluator;

  beforeEach(() => {
    context = new MockDataContext({
      foo: 'bar',
      num: 42,
      nested: 'foo'
    });
    evaluator = new MockEvaluator();
    parser = new ExpressionParser(context, evaluator);
  });

  it('parses literal strings unchanged', (_t, done) => {
    parser.parse('hello world').subscribe(result => {
      assert.strictEqual(result, 'hello world');
      done();
    });
  });

  it('parses simple interpolation', (_t, done) => {
    parser.parse('hello ${foo}').subscribe(result => {
      assert.strictEqual(result, 'hello bar');
      done();
    });
  });

  it('parses number interpolation', (_t, done) => {
    parser.parse('number is ${num}').subscribe(result => {
      assert.strictEqual(result, 'number is 42');
      done();
    });
  });

  it('parses nested interpolation', (_t, done) => {
    parser.parse('val is ${${nested}}').subscribe(result => {
      assert.strictEqual(result, 'val is foo');
      done();
    });
  });

  it('handles escaped interpolation', (_t, done) => {
    parser.parse('escaped \\${foo}').subscribe(result => {
      assert.strictEqual(result, 'escaped ${foo}');
      done();
    });
  });

  it('parses function calls', (_t, done) => {
    parser.parse('sum is ${add(a: 10, b: 20)}').subscribe(result => {
      assert.strictEqual(result, 'sum is 30');
      done();
    });
  });

  it('parses function calls with string literals', (_t, done) => {
    parser.parse('case is ${upper(text: "hello")}').subscribe(result => {
      assert.strictEqual(result, 'case is HELLO');
      done();
    });
  });

  it('parses keywords', (_t, done) => {
    parser.parse('${true} ${false} ${null}').subscribe(result => {
      assert.strictEqual(result, 'true false '); // null becomes empty string in map
      done();
    });
  });

  it('throws on max depth exceeded', () => {
    assert.throws(() => {
      parser.parse('depth', 11);
    }, /Max recursion depth reached/);
  });

  it('handles deep recursion gracefully or throws', (_t, done) => {
     // Verify it works for reasonable depth.
     parser.parse('${${${"hello"}}}').subscribe(result => {
       assert.strictEqual(result, 'hello');
       done();
     });
  });
});
