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
import { Surface } from './surface';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID, Component } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DynamicComponent } from '../rendering/dynamic-component';

@Component({
  selector: 'mock-child',
  standalone: true,
  template: '<div class="child-content">Child Content</div>',
})
class MockChild extends DynamicComponent {}

describe('Surface', () => {
  let component: Surface;
  let fixture: ComponentFixture<Surface>;
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
      components: {},
      additionalStyles: {},
    };

    mockCatalog = {
      Text: () => Promise.resolve(MockChild),
    };

    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Surface, MockChild],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Surface);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('surface', {
      id: 'surface-1',
      componentTree: {
        id: 'c1',
        type: 'Text',
        weight: 1,
        properties: {},
      },
      styles: {
        primaryColor: '#ff0000',
        font: 'Arial',
      },
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply primary color palette and font to host element', () => {
    const hostElement = fixture.nativeElement;
    expect(hostElement.style.getPropertyValue('--p-50')).toBe('#ff0000');
    expect(hostElement.style.getPropertyValue('--font-family')).toBe('Arial');
    // Check one mixed color
    expect(hostElement.style.getPropertyValue('--p-100')).toBe('#ffffff');
  });

  it('should render component tree via a2ui-renderer', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const child = fixture.nativeElement.querySelector('.child-content');
    expect(child).toBeTruthy();
  });

  it('should not render if surfaceId or surface is null', () => {
    fixture.componentRef.setInput('surfaceId', null);
    fixture.detectChanges();
    let child = fixture.nativeElement.querySelector('.child-content');
    expect(child).toBeNull();

    fixture.componentRef.setInput('surfaceId', 's1');
    fixture.componentRef.setInput('surface', null);
    fixture.detectChanges();
    child = fixture.nativeElement.querySelector('.child-content');
    expect(child).toBeNull();
  });
});
