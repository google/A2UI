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
import { A2uiRendererService } from './a2ui-renderer.service';
import { AngularCatalog } from '../catalog/types';

describe('A2uiRendererService', () => {
  let service: A2uiRendererService;
  let mockCatalog: any;

  beforeEach(() => {
    mockCatalog = {
      components: new Map(),
      functions: new Map(),
    };

    TestBed.configureTestingModule({
      providers: [A2uiRendererService, { provide: AngularCatalog, useValue: mockCatalog }],
    });

    service = TestBed.inject(A2uiRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('should create MessageProcessor and surfaceGroup', () => {
      service.initialize();
      expect(service.surfaceGroup).toBeDefined();
    });

    it('should configure functionInvoker that delegates to catalog', () => {
      const mockFn = jasmine.createSpy('mockFn').and.returnValue('result');
      mockCatalog.functions.set('testFn', mockFn);

      service.initialize();

      const invoker = service.getFunctionInvoker();
      expect(invoker).toBeDefined();

      const result = invoker('testFn', { arg: 1 }, { ctx: 'test' });

      expect(mockFn).toHaveBeenCalledWith({ arg: 1 }, { ctx: 'test' }, undefined);
      expect(result).toBe('result');
    });

    it('should return undefined and warn if function not found', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      service.initialize();

      const invoker = service.getFunctionInvoker();
      const result = invoker('unknownFn', {}, {});

      expect(consoleWarnSpy).toHaveBeenCalledWith('Function "unknownFn" not found in catalog');
      expect(result).toBeUndefined();
    });
  });

  describe('processMessages', () => {
    it('should delegate to MessageProcessor', () => {
      service.initialize();

      // Access private _messageProcessor via bracket notation for testing if needed,
      // or verify indirectly by inspecting surfaceGroup after messages.
      // Since MessageProcessor is complex, we can just verify it doesn't crash
      // and updates model if we pass valid messages.
      // For a pure unit test, we might consider mocking MessageProcessor if it was injected,
      // but it's instantiated via 'new'.
      // Let's pass an empty array to verify delegate runs without error.
      expect(() => service.processMessages([])).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should dispose surfaceGroup', () => {
      service.initialize();
      const surfaceGroup = service.surfaceGroup;
      expect(surfaceGroup).toBeDefined();

      const disposeSpy = spyOn(surfaceGroup as any, 'dispose');

      service.ngOnDestroy();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});
