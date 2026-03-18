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
import { TextField } from './text-field';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';

describe('TextField', () => {
  let component: TextField;
  let fixture: ComponentFixture<TextField>;
  let mockMessageProcessor: any;
  let mockTheme: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      getData: jasmine.createSpy('getData').and.returnValue('initial value'),
      setData: jasmine.createSpy('setData'),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
    };

    mockTheme = {
      components: {
        TextField: {
          container: 'tf-container',
          label: 'tf-label',
          element: 'tf-input',
        },
      },
      additionalStyles: {
        TextField: { color: 'blue' },
      },
    };

    await TestBed.configureTestingModule({
      imports: [TextField],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextField);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'tf1',
      type: 'TextField',
      weight: 1,
      properties: {
        text: { path: 'user.name' },
        label: { literalString: 'Name' },
        textFieldType: 'text',
      },
    });
    fixture.componentRef.setInput('text', { path: 'user.name' });
    fixture.componentRef.setInput('label', { literalString: 'Name' });
    fixture.componentRef.setInput('textFieldType', 'text');
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render label and initial value', () => {
    const label = fixture.nativeElement.querySelector('label');
    const input = fixture.nativeElement.querySelector('input');
    expect(label.textContent).toContain('Name');
    expect(input.value).toBe('initial value');
  });

  it('should call setData on input event', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'New Name';
    input.dispatchEvent(new Event('input'));
    expect(mockMessageProcessor.setData).toHaveBeenCalledWith(
      jasmine.any(Object),
      'user.name',
      'New Name',
      'surface-1',
    );
  });

  it('should respect textFieldType', () => {
    fixture.componentRef.setInput('textFieldType', 'number');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('type')).toBe('number');
  });
});
