/**
 * Copyright 2025 Google LLC
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

import { signal, computed, effect, untracked, Injector } from '@angular/core';
import { AngularReactiveProvider } from './angular-reactive-provider';
import { TestBed } from '@angular/core/testing';

describe('AngularReactiveProvider', () => {
  let provider: AngularReactiveProvider;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    injector = TestBed.inject(Injector);
    provider = new AngularReactiveProvider(injector);
  });

  it('should create a signal and read/write value', () => {
    const sig = provider.signal('initial');
    expect(sig()).toBe('initial');
    expect(sig.value).toBe('initial');

    sig.value = 'updated';
    expect(sig()).toBe('updated');
    expect(sig.value).toBe('updated');

    sig.set('direct');
    expect(sig()).toBe('direct');
  });

  it('should create a computed signal', () => {
    const s1 = provider.signal(1);
    const s2 = provider.signal(2);
    const sum = provider.computed(() => s1() + s2());

    expect(sum()).toBe(3);
    s1.value = 10;
    expect(sum()).toBe(12);
  });

  it('should track changes in an effect', () => {
    const sig = provider.signal('initial');
    let effectValue = '';
    
    provider.effect(() => {
      effectValue = sig.value;
    });

    // In Angular tests, effects are scheduled. flushEffects() runs them.
    TestBed.flushEffects();
    expect(effectValue).toBe('initial');

    sig.value = 'updated';
    TestBed.flushEffects();
    expect(effectValue).toBe('updated');
  });
});
