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
import { Button } from './button';
import { MessageProcessor } from '../data/processor';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { Theme } from '../rendering/theming';

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;
  let mockMessageProcessor: any;
  let mockCatalog: any;
  let mockMarkdownRenderer: any;
  let mockTheme: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      dispatch: jasmine.createSpy('dispatch').and.resolveTo([]),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
      getData: jasmine.createSpy('getData').and.returnValue(null),
    };

    mockCatalog = {};

    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    mockTheme = {
      components: { Button: 'btn-class' },
      additionalStyles: {},
    };

    await TestBed.configureTestingModule({
      imports: [Button],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: Theme, useValue: mockTheme },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'btn1',
      type: 'Button',
      weight: 1,
      properties: {
        child: { id: 'text1', type: 'Text', properties: { value: 'Click me' } },
      },
    });
    fixture.componentRef.setInput('weight', 1);
    fixture.componentRef.setInput('action', { action: 'test-action', context: [] });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call handleClick when button is clicked', () => {
    const spy = spyOn(component as any, 'handleClick').and.callThrough();
    const buttonElement = fixture.nativeElement.querySelector('button');
    buttonElement.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should dispatch action when clicked', () => {
    const buttonElement = fixture.nativeElement.querySelector('button');
    buttonElement.click();
    expect(mockMessageProcessor.dispatch).toHaveBeenCalled();
  });
});
