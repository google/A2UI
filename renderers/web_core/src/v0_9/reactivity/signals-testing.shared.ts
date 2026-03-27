/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'node:assert';
import {describe, it} from 'node:test';
import {FrameworkSignal} from './signals.js';

/**
 * Shared verification tests for FrameworkSignal implementations.
 */
export function runFrameworkSignalTests(name: string, SignalImpl: FrameworkSignal) {
  describe(`FrameworkSignal ${name}`, () => {
    it('round trip wraps and unwraps successfully', () => {
      const val = 'hello';
      const wrapped = SignalImpl.wrap(val);
      assert.strictEqual(SignalImpl.unwrap(wrapped), val);
    });

    it('handles updates well', () => {
      const signal = SignalImpl.wrap('first');
      const computedVal = SignalImpl.computed(() => `prefix ${SignalImpl.unwrap(signal)}`);

      assert.strictEqual(SignalImpl.unwrap(signal), 'first');
      assert.strictEqual(SignalImpl.unwrap(computedVal), 'prefix first');

      SignalImpl.set(signal, 'second');

      assert.strictEqual(SignalImpl.unwrap(signal), 'second');
      assert.strictEqual(SignalImpl.unwrap(computedVal), 'prefix second');
    });

    describe('.isSignal()', () => {
      it('validates a signal', () => {
        const val = 'hello';
        const wrapped = SignalImpl.wrap(val);
        assert.ok(SignalImpl.isSignal(wrapped));
      });

      it('rejects a non-signal', () => {
        assert.strictEqual(SignalImpl.isSignal('hello'), false);
      });
    });
  });
}
