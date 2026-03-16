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

import { TestBed } from '@angular/core/testing';
import { DataModel, SurfaceModel, DataContext } from '@a2ui/web_core/v0_9';
import { MinimalCatalog } from '../catalog/minimal/minimal-catalog';
import { toAngularSignal } from './utils';
import { DestroyRef } from '@angular/core';

describe('Capitalize Function Binding', () => {
  let mockDestroyRef: jasmine.SpyObj<DestroyRef>;

  beforeEach(() => {
    mockDestroyRef = jasmine.createSpyObj('DestroyRef', ['onDestroy']);
    mockDestroyRef.onDestroy.and.returnValue(() => {});
  });

  it('should update output correctly when bound input updates using function call binding', () => {
    const catalog = new MinimalCatalog();
    
    // Create Surface Model and DataContext
    const surface = new SurfaceModel('surface_1', catalog);
    const dataModel = surface.dataModel;
    const context = new DataContext(surface, '/');

    const callValue = {
      call: 'capitalize',
      args: {
        value: {
          path: '/inputValue'
        }
      },
      returnType: 'string'
    };

    // 1. Resolve Signal
    const resSig = context.resolveSignal<string>(callValue as any);

    // 2. Convert to Angular Signal
    const angSig = toAngularSignal(resSig, mockDestroyRef);

    // 3. Initial state
    expect(angSig()).toBe('');

    // 4. Update data model Simulation typing
    dataModel.set('/inputValue', 'regression test');

    // 5. Verify reactive updates
    expect(angSig()).toBe('Regression test');

    // 6. Update again to confirm reactive stream remains healthy
    dataModel.set('/inputValue', 'another test');
    expect(angSig()).toBe('Another test');
  });
});
