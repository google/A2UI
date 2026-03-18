/*
 * Copyright 2025 Google LLC
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Checkbox } from './checkbox';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';

describe('Checkbox', () => {
  let component: Checkbox;
  let fixture: ComponentFixture<Checkbox>;
  let mockMessageProcessor: any;
  let mockTheme: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      getData: jasmine.createSpy('getData').and.returnValue(true),
      setData: jasmine.createSpy('setData'),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
    };

    mockTheme = {
      components: {
        CheckBox: {
          container: 'cb-container',
          label: 'cb-label',
          element: 'cb-input',
        },
      },
      additionalStyles: {
        CheckBox: { display: 'flex' },
      },
    };

    await TestBed.configureTestingModule({
      imports: [Checkbox],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkbox);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'cb1',
      type: 'CheckBox',
      weight: 1,
      properties: {
        value: { path: 'user.agreed' },
        label: { literalString: 'I agree' },
      },
    });
    fixture.componentRef.setInput('value', { path: 'user.agreed' });
    fixture.componentRef.setInput('label', { literalString: 'I agree' });
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label and be checked initially', () => {
    const label = fixture.nativeElement.querySelector('label');
    const input = fixture.nativeElement.querySelector('input');
    expect(label.textContent).toContain('I agree');
    expect(input.checked).toBe(true);
  });

  it('should call setData on change event', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.checked = false;
    input.dispatchEvent(new Event('change'));
    expect(mockMessageProcessor.setData).toHaveBeenCalledWith(
      jasmine.any(Object),
      'user.agreed',
      false,
      'surface-1',
    );
  });
});
