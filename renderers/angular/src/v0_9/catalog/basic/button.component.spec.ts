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
import { Component, Input, signal } from '@angular/core';
import { ButtonComponent } from './button.component';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { ComponentBinder } from '../../core/component-binder.service';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let mockRendererService: any;
  let mockSurface: any;
  let mockSurfaceGroup: any;

  beforeEach(async () => {
    mockSurface = {
      dispatchAction: jasmine.createSpy('dispatchAction'),
      componentsModel: new Map([
        ['child1', { id: 'child1', type: 'Text', properties: { text: 'Child Content' } }],
      ]),
      catalog: {
        id: 'test-catalog',
        components: new Map([
          [
            'Text',
            {
              component: (() => {
                @Component({
                  standalone: true,
                  selector: 'dummy-text',
                  template: 'Dummy Text',
                })
                class DummyText {
                  @Input() props: any;
                  @Input() surfaceId?: string;
                  @Input() dataContextPath?: string;
                }
                return DummyText;
              })(),
            },
          ],
        ]),
      },
    };

    mockSurfaceGroup = {
      getSurface: jasmine.createSpy('getSurface').and.returnValue(mockSurface),
    };

    mockRendererService = {
      surfaceGroup: mockSurfaceGroup,
    };

    const mockBinder = jasmine.createSpyObj('ComponentBinder', ['bind']);
    mockBinder.bind.and.returnValue({ text: { value: () => 'bound text' } });

    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
      providers: [
        { provide: A2uiRendererService, useValue: mockRendererService },
        { provide: ComponentBinder, useValue: mockBinder },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('surfaceId', 'surf1');
    fixture.componentRef.setInput('props', {
      variant: { value: signal('primary'), raw: 'primary', onUpdate: () => {} },
      child: { value: signal('child1'), raw: 'child1', onUpdate: () => {} },
      action: {
        value: signal({ type: 'test-action', data: {} }),
        raw: { type: 'test-action', data: {} },
        onUpdate: () => {},
      },
    });
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set button type to submit for primary variant', () => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.type).toBe('submit');
  });

  it('should set button type to button for non-primary variant', () => {
    fixture.componentRef.setInput('props', {
      ...component.props(),
      variant: {
        value: signal('secondary'),
        raw: 'secondary',
        onUpdate: () => {},
      },
    });
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.type).toBe('button');
  });

  it('should apply variant class', () => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    expect(button.nativeElement.classList).toContain('primary');
  });

  it('should handle click and dispatch action', () => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(mockSurfaceGroup.getSurface).toHaveBeenCalledWith('surf1');
    expect(mockSurface.dispatchAction).toHaveBeenCalled();
  });

  it('should show child component host if child prop is present', () => {
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.css('a2ui-v09-component-host'));
    expect(host).toBeTruthy();
    expect(host.componentInstance.componentId()).toBe('child1');
  });

  it('should not show child component host if child prop is absent', () => {
    fixture.componentRef.setInput('props', {
      ...component.props(),
      child: { value: signal(null), raw: null, onUpdate: () => {} },
    });
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.css('a2ui-v09-component-host'));
    expect(host).toBeFalsy();
  });
});
