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
import { Slider } from './slider';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { Catalog } from '../rendering/catalog';
import { MarkdownRenderer } from '../data/markdown';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('Slider', () => {
  let component: Slider;
  let fixture: ComponentFixture<Slider>;
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
        Slider: {
          container: 'custom-slider-container',
          label: 'custom-slider-label',
          element: 'custom-slider-input',
        },
      },
      additionalStyles: {
        Slider: { 'accent-color': 'red' },
      },
    };

    mockCatalog = {};
    mockMarkdownRenderer = {
      render: jasmine.createSpy('render').and.resolveTo(''),
    };

    await TestBed.configureTestingModule({
      imports: [Slider],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: Catalog, useValue: mockCatalog },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Slider);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'slider1',
      type: 'Slider',
      weight: 1,
      properties: {
        value: { literalNumber: 50 },
        label: 'Volume',
        minValue: 0,
        maxValue: 100,
      },
    });
    fixture.componentRef.setInput('value', { literalNumber: 50 });
    fixture.componentRef.setInput('label', 'Volume');
    fixture.componentRef.setInput('minValue', 0);
    fixture.componentRef.setInput('maxValue', 100);
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render input with correct attributes', () => {
    const input = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('range');
    expect(input.value).toBe('50');
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  it('should calculate percentComplete correctly', () => {
    // 50 out of 0-100 is 50%
    const input = fixture.nativeElement.querySelector('input');
    expect(input.style.getPropertyValue('--slider-percent')).toBe('50%');

    fixture.componentRef.setInput('value', { literalNumber: 25 });
    fixture.detectChanges();
    expect(input.style.getPropertyValue('--slider-percent')).toBe('25%');
  });

  it('should call setData and update CSS variable on input', () => {
    fixture.componentRef.setInput('value', { path: 'volume', literalNumber: 50 });
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    input.value = '75';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(mockMessageProcessor.setData).toHaveBeenCalledWith(
      jasmine.any(Object),
      'volume',
      75,
      'surface-1',
    );
    expect(input.style.getPropertyValue('--slider-percent')).toBe('75%');
  });

  it('should handle zero range', () => {
    fixture.componentRef.setInput('minValue', 50);
    fixture.componentRef.setInput('maxValue', 50);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    expect(input.style.getPropertyValue('--slider-percent')).toBe('0%');
  });
});
