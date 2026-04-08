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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextFieldComponent } from './text-field.component';
import { signal } from '@angular/core';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { By } from '@angular/platform-browser';
import { preactSignal } from '../../core/utils';

describe('TextFieldComponent', () => {
  let component: TextFieldComponent;
  let fixture: ComponentFixture<TextFieldComponent>;
  let mockRendererService: any;

  beforeEach(async () => {
    mockRendererService = {};

    await TestBed.configureTestingModule({
      imports: [TextFieldComponent],
      providers: [{ provide: A2uiRendererService, useValue: mockRendererService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TextFieldComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('props', {
      label: { value: signal('Username'), raw: 'Username', onUpdate: () => {} },
      value: {
        value: signal('testuser'),
        raw: 'testuser',
        onUpdate: jasmine.createSpy('onUpdate'),
      },
      placeholder: { value: signal('Enter username'), raw: 'Enter username', onUpdate: () => {} },
      variant: { value: signal('text'), raw: 'text', onUpdate: () => {} },
    });
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render label if provided', () => {
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label.nativeElement.textContent).toBe('Username');
  });

  it('should not render label if not provided', () => {
    fixture.componentRef.setInput('props', {
      ...component.props(),
      label: { value: signal(null), raw: null, onUpdate: () => {} },
    });
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('label'));
    expect(label).toBeFalsy();
  });

  it('should render input with correct value and placeholder', () => {
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    expect(input.nativeElement.value).toBe('testuser');
    expect(input.nativeElement.placeholder).toBe('Enter username');
  });

  it('should return correct input type based on variant', () => {
    expect(component.inputType()).toBe('text');

    fixture.componentRef.setInput('props', {
      ...component.props(),
      variant: { value: signal('obscured'), raw: 'obscured', onUpdate: () => {} },
    });
    expect(component.inputType()).toBe('password');

    fixture.componentRef.setInput('props', {
      ...component.props(),
      variant: { value: signal('number'), raw: 'number', onUpdate: () => {} },
    });
    expect(component.inputType()).toBe('number');
  });

  it('should call onUpdate when input changes', () => {
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input'));
    input.nativeElement.value = 'newuser';
    input.triggerEventHandler('input', { target: input.nativeElement });

    expect(component.props()['value'].onUpdate).toHaveBeenCalledWith('newuser');
  });

  it('should show error messages when checks fail', async () => {
    const isValidSig = signal(true);
    const errorsSig = signal<string[]>([]);

    fixture.componentRef.setInput('props', {
      ...component.props(),
      isValid: { value: isValidSig, raw: true, onUpdate: () => {} },
      validationErrors: { value: errorsSig, raw: [], onUpdate: () => {} },
    });

    fixture.detectChanges();

    const errorMsgBefore = fixture.debugElement.query(By.css('.a2ui-error-message'));
    expect(errorMsgBefore).toBeFalsy();

    isValidSig.set(false);
    errorsSig.set(['Value is required']);
    fixture.detectChanges();

    const errorMsgAfter = fixture.debugElement.query(By.css('.a2ui-error-message'));
    expect(errorMsgAfter).toBeTruthy();
    expect(errorMsgAfter.nativeElement.textContent).toContain('Value is required');
  });

  it('should handle multiple error messages', () => {
    fixture.componentRef.setInput('props', {
      ...component.props(),
      isValid: { value: signal(false), raw: false, onUpdate: () => {} },
      validationErrors: { value: signal(['Error 1', 'Error 2']), raw: ['Error 1', 'Error 2'], onUpdate: () => {} },
    });

    fixture.detectChanges();

    const errorMsgs = fixture.debugElement.queryAll(By.css('.a2ui-error-message'));
    expect(errorMsgs.length).toBe(2);
    expect(errorMsgs[0].nativeElement.textContent).toContain('Error 1');
    expect(errorMsgs[1].nativeElement.textContent).toContain('Error 2');
  });
});
