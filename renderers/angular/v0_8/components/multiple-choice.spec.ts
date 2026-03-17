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
import { MultipleChoice } from './multiple-choice';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('MultipleChoice', () => {
  let component: MultipleChoice;
  let fixture: ComponentFixture<MultipleChoice>;
  let mockMessageProcessor: any;
  let mockTheme: any;
  let mockCatalog: any;
  let mockMarkdownRenderer: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      setData: jasmine.createSpy('setData'),
      getData: jasmine.createSpy('getData').and.returnValue(null),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
    };

    mockTheme = {
      components: {
        MultipleChoice: {
          container: 'custom-container',
          label: 'custom-label',
          element: 'custom-select',
        },
      },
      additionalStyles: {
        MultipleChoice: { border: '1px solid black' },
      },
    };

    mockCatalog = {};
    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [MultipleChoice],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MultipleChoice);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'mc1',
      type: 'MultipleChoice',
      weight: 1,
      properties: {
        options: [
          { label: { literalString: 'Option 1' }, value: 'opt1' },
          { label: { literalString: 'Option 2' }, value: 'opt2' },
        ],
        value: { path: 'selectedOpt', literalString: 'opt1' },
        description: 'Choose one',
      },
    });
    fixture.componentRef.setInput('options', [
      { label: { literalString: 'Option 1' }, value: 'opt1' },
      { label: { literalString: 'Option 2' }, value: 'opt2' },
    ]);
    fixture.componentRef.setInput('value', { path: 'selectedOpt', literalString: 'opt1' });
    fixture.componentRef.setInput('description', 'Choose one');
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render options and initial value', () => {
    const select = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('opt1');
    const options = fixture.nativeElement.querySelectorAll('option');
    expect(options.length).toBe(2);
    expect(options[0].textContent).toBe('Option 1');
    expect(options[1].textContent).toBe('Option 2');
  });

  it('should call setData on change', () => {
    const select = fixture.nativeElement.querySelector('select');
    select.value = 'opt2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(mockMessageProcessor.setData).toHaveBeenCalledWith(
      jasmine.any(Object),
      'selectedOpt',
      'opt2',
      'surface-1',
    );
  });

  it('should apply theme classes', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.classList).toContain('custom-container');
    const label = fixture.nativeElement.querySelector('label');
    expect(label.classList).toContain('custom-label');
    const select = fixture.nativeElement.querySelector('select');
    expect(select.classList).toContain('custom-select');
  });
});
