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
import { DatetimeInput } from './datetime-input';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('DatetimeInput', () => {
  let component: DatetimeInput;
  let fixture: ComponentFixture<DatetimeInput>;
  let mockMessageProcessor: any;
  let mockTheme: any;
  let mockCatalog: any;
  let mockMarkdownRenderer: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      getData: jasmine.createSpy('getData').and.returnValue('2025-03-16T12:00:00Z'),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
      setData: jasmine.createSpy('setData'),
    };

    mockTheme = {
      components: {
        DateTimeInput: {
          container: 'custom-container',
          label: 'custom-label',
          element: 'custom-input',
        },
      },
      additionalStyles: {
        DateTimeInput: { background: 'red' },
      },
    };

    mockCatalog = {};

    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [DatetimeInput],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DatetimeInput);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'dt1',
      type: 'DateTimeInput',
      weight: 1,
      properties: {},
    });
    fixture.componentRef.setInput('value', { path: 'date_path' });
    fixture.componentRef.setInput('enableDate', true);
    fixture.componentRef.setInput('enableTime', true);
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render with correct type and value', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('datetime-local');
    // 2025-03-16T12:00:00Z might be different depending on local TZ
    // but a2ui-datetime-input uses new Date(parsed) and then gets local parts.
    // We'll check if it's formatted reasonably.
    expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('should change input type based on enableDate/enableTime', () => {
    fixture.componentRef.setInput('enableTime', false);
    fixture.detectChanges();
    let input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('date');

    fixture.componentRef.setInput('enableDate', false);
    fixture.componentRef.setInput('enableTime', true);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('time');
  });

  it('should call setData on input change', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.value = '2025-04-20T16:20';
    input.dispatchEvent(new Event('input'));

    expect(mockMessageProcessor.setData).toHaveBeenCalled();
  });

  it('should apply theme classes', () => {
    const section = fixture.nativeElement.querySelector('section');
    const label = fixture.nativeElement.querySelector('label');
    const input = fixture.nativeElement.querySelector('input');

    expect(section.className).toBe('custom-container');
    expect(label.className).toBe('custom-label');
    expect(input.className).toBe('custom-input');
  });
});
