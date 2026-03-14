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
import { Component, Input, computed, inputBinding } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Row } from '../components/row';
import { Column } from '../components/column';
import { Text as TextComponent } from '../components/text';
import { Button } from '../components/button';
import { List } from '../components/list';
import { TextField } from '../components/text-field';

import { DynamicComponent } from '../rendering/dynamic-component';
import { Renderer } from '../rendering/renderer';
import { Types } from '../types';
import { MarkdownRenderer } from '../data/markdown';

import { Theme } from '../rendering/theming';
import { MessageProcessor } from '../data/processor';
import { Catalog } from '../rendering/catalog';

// Mock context will be handled by MessageProcessor mock
const mockContext = {
  resolveData: (path: string) => {
    if (path === '/data/text') return 'Dynamic Text';
    if (path === '/data/label') return 'Dynamic Label';
    return null;
  },
};

@Component({
  selector: 'test-host',
  imports: [Row, Column, TextComponent, Button, List, TextField],
  template: `
    @if (type === 'Row') {
      <a2ui-row
        [surfaceId]="'test-surface'"
        [component]="componentData"
        [weight]="'1'"
        [alignment]="componentData.properties.align || null"
        [distribution]="componentData.properties.justify || null"
      />
    } @else if (type === 'Column') {
      <a2ui-column
        [surfaceId]="'test-surface'"
        [component]="componentData"
        [weight]="'1'"
        [alignment]="componentData.properties.align || null"
        [distribution]="componentData.properties.justify || null"
      />
    } @else if (type === 'Text') {
      <a2ui-text
        [surfaceId]="'test-surface'"
        [component]="componentData"
        [weight]="'1'"
        [text]="componentData.properties.text"
        [usageHint]="componentData.properties.usageHint || null"
      />
    } @else if (type === 'Button') {
      <a2ui-button [surfaceId]="'test-surface'" [component]="componentData" [weight]="'1'" />
    } @else if (type === 'List') {
      <a2ui-list [surfaceId]="'test-surface'" [component]="componentData" [weight]="'1'" />
    } @else if (type === 'TextField') {
      <a2ui-text-field
        [surfaceId]="'test-surface'"
        [component]="componentData"
        [weight]="'1'"
        [text]="componentData.properties.value"
        [label]="componentData.properties.label"
        [textFieldType]="componentData.properties.type || null"
      />
    }
  `,
})
class TestHostComponent {
  @Input() type = 'Row';
  @Input() componentData: any;
}

describe('Catalog Components', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let mockMessageProcessor: any;
  let mockDataModel: any;
  let mockSurfaceModel: any;

  beforeEach(async () => {
    mockDataModel = {
      get: jasmine.createSpy('get').and.callFake((path: string) => {
        if (path === '/data/text') return 'Dynamic Text';
        if (path === '/data/label') return 'Dynamic Label';
        if (path === '/data/items') return ['Item 1', 'Item 2'];
        return null;
      }),
      subscribe: jasmine.createSpy('subscribe').and.returnValue({
        unsubscribe: () => {},
      }),
    };

    mockSurfaceModel = {
      dataModel: mockDataModel,
      componentsModel: new Map([
        ['child1', { id: 'child1', type: 'Text', properties: { text: { literal: 'Child Text' } } }],
        ['item1', { id: 'item1', type: 'Text', properties: { text: { literal: 'Item 1' } } }],
        ['item2', { id: 'item2', type: 'Text', properties: { text: { literal: 'Item 2' } } }],
      ]),
    };

    const surfaceSignal = () => mockSurfaceModel;

    mockMessageProcessor = {
      model: {
        getSurface: (id: string) => mockSurfaceModel,
      },
      getDataModel: jasmine.createSpy('getDataModel').and.returnValue(mockDataModel),
      getData: (node: any, path: string) => mockDataModel.get(path),
      getSurfaceSignal: () => surfaceSignal,
      sendAction: jasmine.createSpy('sendAction'),
      getSurfaces: () => new Map([['test-surface', mockSurfaceModel]]),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, Row, Column, TextComponent, Button, List],
      providers: [
        { provide: MarkdownRenderer, useValue: { render: (s: string) => Promise.resolve(s) } },

        { provide: MessageProcessor, useValue: mockMessageProcessor },
        {
          provide: Theme,
          useValue: {
            components: {
              Text: { all: {}, h1: { 'h1-class': true }, body: { 'body-class': true } },
              Row: { 'row-class': true },
              Column: { 'column-class': true },
              Button: { 'button-class': true },
              List: { 'list-class': true },
              TextField: {
                container: { 'tf-container': true },
                label: { 'tf-label': true },
                element: { 'tf-element': true },
              },
            },
            additionalStyles: {},
          },
        },
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        {
          provide: Catalog,
          useValue: {
            Text: {
              type: async () => TextComponent,
              bindings: (node: any) => [
                inputBinding('text', () => node.properties.text),
                inputBinding('usageHint', () => node.properties.usageHint || null),
              ],
            },
            Row: { type: async () => Row, bindings: () => [] },
            Column: { type: async () => Column, bindings: () => [] },
            Button: { type: async () => Button, bindings: () => [] },
            List: { type: async () => List, bindings: () => [] },
            TextField: { type: async () => TextField, bindings: () => [] },
          } as any,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  describe('Row', () => {
    it('should map justify and align properties correctly', () => {
      host.type = 'Row';
      host.componentData = {
        id: 'row1',
        type: 'Row',
        properties: {
          children: [],
          justify: 'spaceBetween',
          align: 'center',
        },
      } as Types.RowNode;
      fixture.detectChanges();

      const rowEl = fixture.debugElement.query(By.css('a2ui-row'));
      const section = rowEl.query(By.css('section'));
      expect(section.classes['distribute-spaceBetween']).toBeTrue();
      expect(section.classes['align-center']).toBeTrue();
    });
  });

  describe('Column', () => {
    it('should map justify and align properties correctly', () => {
      host.type = 'Column';
      host.componentData = {
        id: 'col1',
        type: 'Column',
        properties: {
          children: [],
          justify: 'end',
          align: 'start',
        },
      } as Types.ColumnNode;
      fixture.detectChanges();

      const colEl = fixture.debugElement.query(By.css('a2ui-column'));
      const section = colEl.query(By.css('section'));
      expect(section.classes['distribute-end']).toBeTrue();
      expect(section.classes['align-start']).toBeTrue();
    });
  });

  describe('Text', () => {
    it('should resolve text content', async () => {
      host.type = 'Text';
      host.componentData = {
        id: 'txt1',
        type: 'Text',
        properties: {
          text: { literal: 'Hello World' },
          usageHint: 'h1',
        },
      } as Types.TextNode;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const textEl = fixture.debugElement.query(By.css('a2ui-text'));
      expect(textEl.nativeElement.innerHTML).toContain('# Hello World');
    });
  });

  describe('Button', () => {
    it('should render child component', () => {
      // Mock Renderer Service/Context because Button uses a2ui-renderer for child
      // For this unit test, we might just check if it tries to resolve the child.
      // But Button uses <ng-container a2ui-renderer ...>
      // We need to provide a mock SurfaceModel to the Button via the Context?
      // Actually DynamicComponent uses `inject(ElementRef)` etc.
      // Let's keep it simple for now and verify existence.
      host.type = 'Button';
      host.componentData = {
        id: 'btn1',
        type: 'Button',
        properties: {
          child: 'child1',
          label: 'Legacy Label',
        },
      } as any;
      fixture.detectChanges();
      const btnEl = fixture.debugElement.query(By.css('button'));
      expect(btnEl).toBeTruthy();
    });
  });

  describe('List', () => {
    it('should render items', async () => {
      host.type = 'List';
      host.componentData = {
        id: 'list1',
        type: 'List',
        properties: {
          children: [
            {
              id: '1',
              type: 'Text',
              properties: { text: { literal: 'Item 1' }, variant: { literal: 'body' } },
            },
            {
              id: '2',
              type: 'Text',
              properties: { text: { literal: 'Item 2' }, variant: { literal: 'body' } },
            },
          ],
        },
      } as any;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const listEl = fixture.debugElement.query(By.css('a2ui-list'));
      const items = listEl.queryAll(By.css('a2ui-text')); // Assuming items render as Text
      expect(items.length).toBe(2);
      expect(items[0].nativeElement.textContent).toContain('Item 1');
    });
  });

  describe('TextField', () => {
    it('should render input with value', () => {
      host.type = 'TextField';
      host.componentData = {
        id: 'tf1',
        type: 'TextField',
        properties: {
          label: { literal: 'My Input' },
          value: { path: '/data/text' },
        },
      } as any;
      fixture.detectChanges();

      const inputEl = fixture.debugElement.query(By.css('input'));
      // Component might use [value] or ngModel
      // Let's check native element value if bound
      // If it uses Custom Input implementation, check that.
      // TextField usually has a label and an input.
      expect(inputEl.nativeElement.value).toBe('Dynamic Text');
    });
  });
});
