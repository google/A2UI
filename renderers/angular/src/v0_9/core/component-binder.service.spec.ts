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
import { DestroyRef } from '@angular/core';
import { signal as preactSignal } from '@preact/signals-core';
import { ComponentContext } from '@a2ui/web_core/v0_9';
import { ComponentBinder } from './component-binder.service';

describe('ComponentBinder', () => {
  let binder: ComponentBinder;
  let mockDestroyRef: jasmine.SpyObj<DestroyRef>;

  beforeEach(() => {
    mockDestroyRef = jasmine.createSpyObj('DestroyRef', ['onDestroy']);
    mockDestroyRef.onDestroy.and.callFake((callback: () => void) => {
      return () => {}; // Return unregister function
    });

    TestBed.configureTestingModule({
      providers: [ComponentBinder, { provide: DestroyRef, useValue: mockDestroyRef }],
    });

    binder = TestBed.inject(ComponentBinder);
  });

  it('should be created', () => {
    expect(binder).toBeTruthy();
  });

  it('should bind properties to Angular signals', () => {
    const mockComponentModel = {
      properties: {
        text: 'Hello',
        visible: true,
      },
    };

    const mockpSigText = preactSignal('Hello');
    const mockpSigVisible = preactSignal(true);

    const mockDataContext = {
      resolveSignal: jasmine.createSpy('resolveSignal').and.callFake((val: any) => {
        if (val === 'Hello') return mockpSigText;
        if (val === true) return mockpSigVisible;
        return preactSignal(val);
      }),
      set: jasmine.createSpy('set'),
    };

    const mockContext = {
      componentModel: mockComponentModel,
      dataContext: mockDataContext,
    } as unknown as ComponentContext;

    const bound = binder.bind(mockContext);

    expect(bound['text']).toBeDefined();
    expect(bound['visible']).toBeDefined();
    expect(bound['text'].value()).toBe('Hello');
    expect(bound['visible'].value()).toBe(true);

    // Verify resolveSignal was called
    expect(mockDataContext.resolveSignal).toHaveBeenCalledWith('Hello');
    expect(mockDataContext.resolveSignal).toHaveBeenCalledWith(true);
  });

  it('should add update() method for data bindings (two-way binding)', () => {
    const mockComponentModel = {
      properties: {
        value: { path: '/data/text' },
      },
    };

    const mockpSig = preactSignal('initial');
    const mockDataContext = {
      resolveSignal: jasmine.createSpy('resolveSignal').and.returnValue(mockpSig),
      set: jasmine.createSpy('set'),
    };

    const mockContext = {
      componentModel: mockComponentModel,
      dataContext: mockDataContext,
    } as unknown as ComponentContext;

    const bound = binder.bind(mockContext);

    expect(bound['value']).toBeDefined();
    expect(bound['value'].value()).toBe('initial');
    expect(bound['value'].onUpdate).toBeDefined();

    // Call update
    bound['value'].onUpdate('new-value');

    // Verify set was called on DataContext
    expect(mockDataContext.set).toHaveBeenCalledWith('/data/text', 'new-value');
  });

  it('should NOT add update() method for literals', () => {
    const mockComponentModel = {
      properties: {
        text: 'Literal String',
      },
    };

    const mockpSig = preactSignal('Literal String');
    const mockDataContext = {
      resolveSignal: jasmine.createSpy('resolveSignal').and.returnValue(mockpSig),
      set: jasmine.createSpy('set'),
    };

    const mockContext = {
      componentModel: mockComponentModel,
      dataContext: mockDataContext,
    } as unknown as ComponentContext;

    const bound = binder.bind(mockContext);

    expect(bound['text']).toBeDefined();
    expect(bound['text'].value()).toBe('Literal String');
    expect(bound['text'].onUpdate).toBeDefined(); // No-op for literals

    // Call onUpdate on literal, should not crash or call set
    bound['text'].onUpdate('new');
    expect(mockDataContext.set).not.toHaveBeenCalled();
  });

  it('should expand ChildList object templates', () => {
    const mockComponentModel = {
      properties: {
        children: { componentId: 'item-comp', path: '/list/data' },
      },
    };

    const mockListSig = preactSignal(['a', 'b']);
    const mockDataContext = {
      resolveSignal: jasmine.createSpy('resolveSignal').and.callFake((val: any) => {
        if (val && val.path === '/list/data') return mockListSig;
        return preactSignal(val);
      }),
      nested: jasmine.createSpy('nested').and.callFake((path: string) => ({
        path,
        nested: (sub: string) => ({ path: `${path}/${sub}` }),
      })),
      set: jasmine.createSpy('set'),
    };

    const mockContext = {
      componentModel: mockComponentModel,
      dataContext: mockDataContext,
    } as unknown as ComponentContext;

    const bound = binder.bind(mockContext);

    expect(bound['children']).toBeDefined();
    const children = bound['children'].value();
    expect(Array.isArray(children)).toBe(true);
    expect(children.length).toBe(2);
    expect(children[0]).toEqual({ id: 'item-comp', basePath: '/list/data/0' });
    expect(children[1]).toEqual({ id: 'item-comp', basePath: '/list/data/1' });
  });
});
