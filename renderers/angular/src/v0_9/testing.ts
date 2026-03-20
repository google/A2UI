/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the \"License\");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an \"AS IS\" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injector, signal, Component, input } from '@angular/core';
import { createTestDataContext as createBaseContext } from '@a2ui/web_core/v0_9';
import { AngularReactiveProvider } from './core/angular-reactive-provider';
import { BoundProperty } from './core/types';

/**
 * Creates a DataContext populated with an AngularReactiveProvider.
 * Useful for testing Angular components or services that require native signals.
 * 
 * @param injector The Angular Injector to use for the reactive provider.
 * @param surfaceId Optional ID for the surface.
 * @param basePath Optional base path in the data model.
 * @returns A DataContext configured with Angular native signals.
 */
export function createAngularTestDataContext(
  injector: Injector,
  surfaceId?: string,
  basePath?: string
) {
  return createBaseContext(new AngularReactiveProvider(injector), surfaceId, basePath);
}

/**
 * Creates a mock BoundProperty for testing.
 * 
 * Includes standard properties like value, raw, set, peek, and update.
 * Spies are created for set and update using jasmine.createSpy.
 * 
 * @param val The initial value of the property.
 * @returns A mock BoundProperty.
 */
export function createBoundProperty<T>(val: T, rawValue?: any): BoundProperty<T> {
  const sig = signal(val);
  const prop = () => sig();
  Object.defineProperties(prop, {
    value: { get: () => sig(), configurable: true },
    peek: { value: () => sig(), configurable: true },
    set: {
      value: jasmine.createSpy('set').and.callFake((v: any) => sig.set(v)),
      configurable: true,
    },
    update: {
      value: jasmine.createSpy('update').and.callFake((fn: any) => sig.update(fn)),
      configurable: true,
    },
    raw: { value: rawValue !== undefined ? rawValue : val, configurable: true },
  });
  return prop as any;
}

/**
 * A stub component for testing that accepts all standard A2UI inputs.
 */
@Component({
  selector: 'a2ui-stub',
  template: '',
  standalone: true,
})
export class StubComponent {
  props = input<any>();
  surfaceId = input<string>();
  componentId = input<string>();
  dataContextPath = input<string>();
}

/**
 * Creates a robust mock for the A2uiRendererService.
 *
 * @param surface Optional custom surface mock to return.
 * @returns A mock object for A2uiRendererService.
 */
export function createMockA2uiRendererService(surface?: any) {
  const mockSurface = surface || {
    componentsModel: new Map(),
    catalog: {
      id: 'mock-catalog',
      components: new Map([['Text', { type: 'Text', component: StubComponent }]]),
    },
  };

  return {
    surfaceGroup: {
      getSurface: jasmine.createSpy('getSurface').and.returnValue(mockSurface),
    },
  };
}

/**
 * Creates a mock for the ComponentBinder service.
 *
 * @returns A mock object for ComponentBinder.
 */
export function createMockComponentBinder() {
  return jasmine.createSpyObj('ComponentBinder', ['bind']);
}
