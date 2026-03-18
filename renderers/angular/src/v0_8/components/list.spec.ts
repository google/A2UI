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
import { List } from './list';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('List', () => {
  let component: List;
  let fixture: ComponentFixture<List>;
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
        List: 'custom-list-class',
      },
      additionalStyles: {
        List: { padding: '10px' },
      },
    };

    mockCatalog = {};
    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [List],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(List);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'list1',
      type: 'List',
      weight: 1,
      properties: {
        children: [
          { id: 'text1', type: 'Text', properties: { value: 'Item 1' } },
          { id: 'text2', type: 'Text', properties: { value: 'Item 2' } },
        ],
      },
    });
    fixture.componentRef.setInput('direction', 'vertical');
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render children', () => {
    const items = fixture.nativeElement.querySelectorAll('.a2ui-list-item');
    expect(items.length).toBe(2);
  });

  it('should apply theme class and direction attribute', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.classList).toContain('custom-list-class');
    expect(fixture.nativeElement.getAttribute('direction')).toBe('vertical');

    fixture.componentRef.setInput('direction', 'horizontal');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('direction')).toBe('horizontal');
  });
});
