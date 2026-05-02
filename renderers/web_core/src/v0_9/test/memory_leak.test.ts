/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'node:assert';
import {describe, it} from 'node:test';
import {signal} from '@preact/signals-core';
import {FormatStringImplementation} from '../basic_catalog/functions/basic_functions.js';
import {DataContext} from '../rendering/data-context.js';
import {DataModel} from '../state/data-model.js';

type DestroyCallback = () => void;

function toAngularSignalHarness<T>(
  preactSignal: {peek: () => T; unsubscribe?: () => void},
  onDestroy: (cb: DestroyCallback) => void,
): {value: T} {
  onDestroy(() => {
    if (typeof preactSignal.unsubscribe === 'function') {
      preactSignal.unsubscribe();
    }
  });

  return {value: preactSignal.peek()};
}

function createTestDataContext(
  model: DataModel,
  functionInvoker: (
    name: string,
    args: Record<string, any>,
    abortSignal?: AbortSignal,
  ) => unknown = () => undefined,
): DataContext {
  const mockSurface = {
    dataModel: model,
    catalog: {
      invoker: (
        name: string,
        args: Record<string, any>,
        _context: DataContext,
        abortSignal?: AbortSignal,
      ) => functionInvoker(name, args, abortSignal),
    },
    dispatchError: async () => {},
  } as any;

  return new DataContext(mockSurface, '/');
}

describe('Memory leak regressions', () => {
  it('returns DataModel signals map to initial size after unsubscribe', () => {
    const model = new DataModel({user: {name: 'Alice'}});
    const initialSize = (model as any).signals.size;

    const sub = model.subscribe('/user/name', () => {});
    assert.strictEqual((model as any).signals.size, initialSize + 1);

    sub.unsubscribe();
    assert.strictEqual((model as any).signals.size, initialSize);
  });

  it('keeps shared path signals alive until all subscribers unsubscribe', () => {
    const model = new DataModel({user: {name: 'Alice'}});
    const initialSize = (model as any).signals.size;

    const sub1 = model.subscribe('/user/name', () => {});
    const sub2 = model.subscribe('/user/name', () => {});

    assert.strictEqual((model as any).signals.size, initialSize + 1);

    sub1.unsubscribe();
    assert.strictEqual((model as any).signals.size, initialSize + 1);

    sub2.unsubscribe();
    assert.strictEqual((model as any).signals.size, initialSize);
  });

  it('aborts nested metronome signal when formatString subscription is disposed', () => {
    const model = new DataModel({});
    let metronomeAbortTriggered = false;

    const context = createTestDataContext(model, (name, args, abortSignal) => {
      if (name === 'formatString') {
        return FormatStringImplementation.execute(args, context, abortSignal);
      }

      if (name === 'metronome') {
        const beat = signal(`tick-${args.interval}`);
        abortSignal?.addEventListener('abort', () => {
          metronomeAbortTriggered = true;
        });
        return beat;
      }

      return undefined;
    });

    const sub = context.subscribeDynamicValue<string>(
      {
        call: 'formatString',
        args: {value: '${metronome(interval:10)}'},
        returnType: 'string',
      } as any,
      () => {},
    );

    assert.strictEqual(sub.value, 'tick-10');
    sub.unsubscribe();
    assert.strictEqual(metronomeAbortTriggered, true);
  });

  it('cleans nested function subscriptions for recursive format strings', () => {
    const model = new DataModel({});
    let bCleanupCalls = 0;

    const context = createTestDataContext(model, (name, args, abortSignal) => {
      if (name === 'formatString') {
        return FormatStringImplementation.execute(args, context, abortSignal);
      }

      if (name === 'a') {
        return `a(${args.arg})`;
      }

      if (name === 'b') {
        const bSignal = signal('b');
        (bSignal as any).unsubscribe = () => {
          bCleanupCalls++;
        };
        return bSignal;
      }

      return undefined;
    });

    const sub = context.subscribeDynamicValue<string>(
      {
        call: 'formatString',
        args: {value: '${a(arg:${b()})}'},
        returnType: 'string',
      } as any,
      () => {},
    );

    assert.strictEqual(sub.value, 'a(b)');
    sub.unsubscribe();
    assert.strictEqual(bCleanupCalls, 1);
  });

  it('handles rapid updates and unsubscribe without leaking shared signals', () => {
    const model = new DataModel({user: {name: 'Alice'}});
    const initialSize = (model as any).signals.size;

    const sub = model.subscribe('/user/name', () => {});

    for (let i = 0; i < 20; i++) {
      model.set('/user/name', `Name-${i}`);
    }

    sub.unsubscribe();
    model.set('/user/name', 'Final');

    assert.strictEqual((model as any).signals.size, initialSize);
  });

  it('verifies Angular scoping contract by calling unsubscribe on destroy', () => {
    let destroyCallback: DestroyCallback | undefined;
    let unsubscribeCalls = 0;

    const preactSig = {
      peek: () => 'value',
      unsubscribe: () => {
        unsubscribeCalls++;
      },
    };

    const bridged = toAngularSignalHarness(preactSig, cb => {
      destroyCallback = cb;
    });

    assert.strictEqual(bridged.value, 'value');
    assert.strictEqual(unsubscribeCalls, 0);

    destroyCallback?.();

    assert.strictEqual(unsubscribeCalls, 1);
  });
});
