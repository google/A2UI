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
import { Image } from './image';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('Image', () => {
  let component: Image;
  let fixture: ComponentFixture<Image>;
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
        Image: {
          all: { 'object-fit-cover': true },
          avatar: { 'border-radius-50%': true },
        },
      },
      additionalStyles: {
        Image: { border: '1px solid black' },
      },
    };

    mockCatalog = {};
    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Image],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Image);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'img1',
      type: 'Image',
      weight: 1,
      properties: {
        url: { literalString: 'https://example.com/a.png' },
        altText: { literalString: 'Example Image' },
      },
    });
    fixture.componentRef.setInput('url', { literalString: 'https://example.com/a.png' });
    fixture.componentRef.setInput('usageHint', 'avatar');
    fixture.componentRef.setInput('altText', { literalString: 'Example Image' });
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render img with resolved url and alt text', () => {
    const img = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://example.com/a.png');
    expect(img.alt).toBe('Example Image');
  });

  it('should apply theme classes based on usageHint', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.classList).toContain('object-fit-cover'); // Styles.merge behavior
    expect(section.classList).toContain('border-radius-50%');
  });

  it('should not render if url is null', () => {
    fixture.componentRef.setInput('url', null);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section).toBeNull();
  });
});
