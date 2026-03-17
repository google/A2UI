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
import { Row } from './row';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('Row', () => {
  let component: Row;
  let fixture: ComponentFixture<Row>;
  let mockMessageProcessor: any;
  let mockTheme: any;
  let mockCatalog: any;
  let mockMarkdownRenderer: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      getData: jasmine.createSpy('getData').and.returnValue(null),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
    };

    mockTheme = {
      components: {
        Row: { 'custom-row-class': true },
      },
      additionalStyles: {
        Row: { gap: '10px' },
      },
    };

    mockCatalog = {};
    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Row],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Row);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'row1',
      type: 'Row',
      weight: 1,
      properties: {
        children: [{ id: 'text1', type: 'Text', properties: { value: 'Child 1' } }],
      },
    });
    fixture.componentRef.setInput('alignment', 'center');
    fixture.componentRef.setInput('distribution', 'spaceBetween');
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply alignment and distribution classes', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.classList).toContain('custom-row-class');
    expect(section.classList).toContain('align-center');
    expect(section.classList).toContain('distribute-spaceBetween');
  });
});
