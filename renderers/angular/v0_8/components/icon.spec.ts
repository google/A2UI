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
import { Icon } from './icon';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('Icon', () => {
  let component: Icon;
  let fixture: ComponentFixture<Icon>;
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
        Icon: 'custom-icon-class',
      },
      additionalStyles: {
        Icon: { color: 'blue' },
      },
    };

    mockCatalog = {};
    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Icon],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Icon);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'icon1',
      type: 'Icon',
      weight: 1,
      properties: {
        name: { literalString: 'home' },
      },
    });
    fixture.componentRef.setInput('name', { literalString: 'home' });
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render icon name', () => {
    const span = fixture.nativeElement.querySelector('.g-icon');
    expect(span.textContent).toBe('home');
  });

  it('should convert camelCase to snake_case', () => {
    fixture.componentRef.setInput('name', { literalString: 'settingsApplications' });
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.g-icon');
    expect(span.textContent).toBe('settings_applications');
  });

  it('should trim whitespace', () => {
    fixture.componentRef.setInput('name', { literalString: '  search  ' });
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.g-icon');
    expect(span.textContent).toBe('search');
  });

  it('should apply theme class', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section.classList).toContain('custom-icon-class');
  });

  it('should not render if name is null', () => {
    fixture.componentRef.setInput('name', null);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section).toBeNull();
  });
});
