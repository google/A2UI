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
import { Tabs } from './tabs';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID, Component, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DynamicComponent } from '../rendering/dynamic-component';

@Component({
  selector: 'mock-child',
  standalone: true,
  template: '<div class="child-content">Child Content</div>',
})
class MockChild extends DynamicComponent {}

describe('Tabs', () => {
  let component: Tabs;
  let fixture: ComponentFixture<Tabs>;
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
        Tabs: {
          container: 'custom-tabs-container',
          element: 'custom-tabs-header',
          controls: {
            // Use different prefixes to avoid Styles.merge conflict logic
            all: { 'tabbutton-all': true },
            selected: { 'tabselected-active': true },
          },
        },
      },
      additionalStyles: {
        Tabs: { border: '1px solid black' },
      },
    };

    mockCatalog = {
      Text: () => Promise.resolve(MockChild),
    };

    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Tabs, MockChild],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tabs);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'tabs1',
      type: 'Tabs',
      weight: 1,
      properties: {},
    });
    fixture.componentRef.setInput('tabs', [
      {
        title: { literalString: 'Tab 1' },
        child: { id: 'c1', type: 'Text', weight: 1, properties: {} },
      },
      {
        title: { literalString: 'Tab 2' },
        child: { id: 'c2', type: 'Text', weight: 1, properties: {} },
      },
    ]);
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render tab buttons and initial content', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Tab 1');
    expect(buttons[1].textContent).toContain('Tab 2');

    expect(buttons[0].disabled).toBeTrue();
    expect(buttons[1].disabled).toBeFalse();

    await fixture.whenStable();
    fixture.detectChanges();

    const child = fixture.nativeElement.querySelector('.child-content');
    expect(child).toBeTruthy();
  });

  it('should change tab on click', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    fixture.detectChanges();

    expect(buttons[0].disabled).toBeFalse();
    expect(buttons[1].disabled).toBeTrue();

    await fixture.whenStable();
    fixture.detectChanges();

    // In a real test we'd verify the child component changed if they were different,
    // but here they both use MockChild.
  });

  it('should apply theme classes to buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    // First tab is selected
    expect(buttons[0].classList).toContain('tabbutton-all');
    expect(buttons[0].classList).toContain('tabselected-active');

    // Second tab is not
    expect(buttons[1].classList).toContain('tabbutton-all');
    expect(buttons[1].classList).not.toContain('tabselected-active');
  });
});
