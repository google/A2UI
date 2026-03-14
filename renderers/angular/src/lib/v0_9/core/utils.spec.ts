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

import { DestroyRef } from '@angular/core';
import { signal as preactSignal } from '@preact/signals-core';
import { toAngularSignal } from './utils';

describe('toAngularSignal', () => {
  let mockDestroyRef: jasmine.SpyObj<DestroyRef>;
  let onDestroyCallback: () => void;

  beforeEach(() => {
    onDestroyCallback = () => {};
    mockDestroyRef = jasmine.createSpyObj('DestroyRef', ['onDestroy']);
    mockDestroyRef.onDestroy.and.callFake((callback: () => void) => {
      onDestroyCallback = callback;
      return () => {}; // Return unregister function
    });
  });

  it('should initialize with the current value of Preact signal', () => {
    const pSig = preactSignal('initial');
    const angSig = toAngularSignal(pSig, mockDestroyRef);

    expect(angSig()).toBe('initial');
  });

  it('should update Angular signal when Preact signal changes', () => {
    const pSig = preactSignal('initial');
    const angSig = toAngularSignal(pSig, mockDestroyRef);

    expect(angSig()).toBe('initial');

    pSig.value = 'updated';
    expect(angSig()).toBe('updated');
  });

  it('should dispose Preact effect when DestroyRef triggers', () => {
    const pSig = preactSignal('initial');
    const angSig = toAngularSignal(pSig, mockDestroyRef);

    expect(angSig()).toBe('initial');

    // Trigger cleanup
    onDestroyCallback();

    pSig.value = 'updated';
    // Angular signal should NOT update after disposal
    expect(angSig()).toBe('initial');
  });

  it('should call unsubscribe on Preact signal if available on destroy', () => {
    const pSig = preactSignal('initial') as any;
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');
    pSig.unsubscribe = unsubscribeSpy;

    toAngularSignal(pSig, mockDestroyRef);

    expect(unsubscribeSpy).not.toHaveBeenCalled();

    // Trigger cleanup
    onDestroyCallback();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
