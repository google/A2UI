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

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicComponent } from './dynamic-component';
import { MessageProcessor } from '../data';
import { Theme } from './theming';
import * as Types from '@a2ui/web_core/types/types';

@Component({
  selector: 'a2ui-test-dynamic',
  standalone: true,
  template: '',
})
class TestDynamicComponent extends DynamicComponent {
  public callSendAction(action: Types.Action) {
    return this.sendAction(action);
  }

  public callResolvePrimitive(value: any) {
    return this.resolvePrimitive(value);
  }
}

describe('DynamicComponent', () => {
  let component: TestDynamicComponent;
  let fixture: ComponentFixture<TestDynamicComponent>;
  let mockProcessor: jasmine.SpyObj<MessageProcessor>;
  let mockTheme: any;

  beforeEach(async () => {
    mockProcessor = jasmine.createSpyObj('MessageProcessor', [
      'resolvePath',
      'getData',
      'dispatch',
    ]);
    mockTheme = {};

    await TestBed.configureTestingModule({
      imports: [TestDynamicComponent],
      providers: [
        { provide: MessageProcessor, useValue: mockProcessor },
        { provide: Theme, useValue: mockTheme },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDynamicComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'comp-1',
      type: 'button',
      dataContextPath: '/root',
    });
    fixture.componentRef.setInput('weight', 'normal');

    fixture.detectChanges();
  });

  it('should resolve literals in resolvePrimitive', () => {
    expect(component.callResolvePrimitive({ literal: 'hello' }) as any).toBe('hello');
    expect(component.callResolvePrimitive({ literalString: 'hello' }) as any).toBe('hello');
    expect(component.callResolvePrimitive({ literalNumber: 42 }) as any).toBe(42);
    expect(component.callResolvePrimitive({ literalBoolean: true }) as any).toBe(true);
  });

  it('should resolve paths in resolvePrimitive', () => {
    mockProcessor.getData.and.returnValue('resolved value');
    const result = component.callResolvePrimitive({ path: 'some/path' });
    expect(result).toBe('resolved value');
    expect(mockProcessor.getData).toHaveBeenCalledWith(
      jasmine.any(Object),
      'some/path',
      'surface-1',
    );
  });

  it('should handle null/invalid values in resolvePrimitive', () => {
    expect(component.callResolvePrimitive(null)).toBeNull();
    expect(component.callResolvePrimitive('not an object')).toBeNull();
    expect(component.callResolvePrimitive({})).toBeNull();
  });

  it('should send actions with context', async () => {
    const action: Types.Action = {
      name: 'click',
      context: [
        { key: 'static', value: { literalString: 'value' } },
        { key: 'dynamic', value: { path: 'data/path' } },
      ],
    };

    mockProcessor.resolvePath.and.returnValue('/root/data/path');
    mockProcessor.getData.and.returnValue('dynamic-value');
    mockProcessor.dispatch.and.returnValue(Promise.resolve([]));

    await component.callSendAction(action);

    expect(mockProcessor.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        userAction: jasmine.objectContaining({
          name: 'click',
          sourceComponentId: 'comp-1',
          surfaceId: 'surface-1',
          context: {
            static: 'value',
            dynamic: 'dynamic-value',
          },
        }),
      }),
    );
  });
});
