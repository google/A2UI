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
import { Modal } from './modal';
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

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;
  let mockMessageProcessor: any;
  let mockTheme: any;
  let mockCatalog: any;
  let mockMarkdownRenderer: any;

  beforeEach(async () => {
    // Mock HTMLDialogElement methods if not supported or to track calls
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = jasmine.createSpy('showModal');
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = jasmine.createSpy('close');
    }

    mockMessageProcessor = {
      getData: jasmine.createSpy('getData').and.returnValue(null),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
    };

    mockTheme = {
      components: {
        Modal: {
          backdrop: 'custom-backdrop',
          element: 'custom-modal-element',
        },
      },
      additionalStyles: {
        Modal: { background: 'blue' },
      },
    };

    mockCatalog = {
      Text: () => Promise.resolve(MockChild),
    };

    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Modal, MockChild],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'm1',
      type: 'Modal',
      weight: 1,
      properties: {
        entryPointChild: { id: 'entry', type: 'Text', weight: 1, properties: {} },
        contentChild: { id: 'content', type: 'Text', weight: 1, properties: {} },
      },
    });
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render entryPointChild initially', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const entryChild = fixture.nativeElement.querySelector('.child-content');
    expect(entryChild).toBeTruthy();
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('should show dialog when entry point is clicked', async () => {
    const entrySection = fixture.nativeElement.querySelector('section');
    entrySection.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('dialog');
    expect(dialog).toBeTruthy();

    await fixture.whenStable();
    fixture.detectChanges();

    const contentChild = dialog.querySelector('.child-content');
    expect(contentChild).toBeTruthy();
  });

  it('should close dialog when close button is clicked', async () => {
    // Open first
    fixture.nativeElement.querySelector('section').click();
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('button');
    closeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('should apply theme classes to dialog and section', async () => {
    fixture.nativeElement.querySelector('section').click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('dialog');
    const modalSection = dialog.querySelector('section');

    expect(dialog.classList).toContain('custom-backdrop');
    expect(modalSection.classList).toContain('custom-modal-element');
  });
});
