import assert from 'node:assert';
import {describe, it} from 'node:test';
import {Signal, computed} from '@preact/signals-core';

import {FrameworkSignal} from './signals';

describe('FrameworkSignal', () => {
  describe('Preact variation', () => {
    // Sample Preact impl.
    const PreactSignal: FrameworkSignal<Signal> = {
      computed: <T>(fn: () => T) => computed(fn),
      isSignal: (val: unknown) => val instanceof Signal,
      wrap: <T>(val: T) => new Signal(val),
      unwrap: <T>(val: Signal<T>) => val.value,
      set: <T>(signal: Signal<T>, value: T) => (signal.value = value),
    };

    it('round trip wraps and unwraps successfully', () => {
      const val = 'hello';
      const wrapped = PreactSignal.wrap(val);
      assert.strictEqual(PreactSignal.unwrap(wrapped), val);
    });

    it('handles updates well', () => {
      const signal = PreactSignal.wrap('first');
      const computed = PreactSignal.computed(() => `prefix ${signal.value}`);

      assert.strictEqual(signal.value, 'first');
      assert.strictEqual(PreactSignal.unwrap(signal), 'first');
      assert.strictEqual(computed.value, 'prefix first');
      assert.strictEqual(PreactSignal.unwrap(computed), 'prefix first');

      PreactSignal.set(signal, 'second');

      assert.strictEqual(signal.value, 'second');
      assert.strictEqual(PreactSignal.unwrap(signal), 'second');
      assert.strictEqual(computed.value, 'prefix second');
      assert.strictEqual(PreactSignal.unwrap(computed), 'prefix second');
    });

    describe('.isSignal()', () => {
      it('validates a signal', () => {
        const val = 'hello';
        const wrapped = PreactSignal.wrap(val);
        assert.ok(PreactSignal.isSignal(wrapped));
      });

      it('rejects a non-signal', () => {
        assert.strictEqual(PreactSignal.isSignal('hello'), false);
      });
    });
  });
});
