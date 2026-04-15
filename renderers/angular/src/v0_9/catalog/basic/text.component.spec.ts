/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextComponent } from './text.component';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { MarkdownRenderer } from '../../core/markdown';

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;
  let mockMarkdownRenderer: jasmine.SpyObj<MarkdownRenderer>;

  beforeEach(async () => {
    mockMarkdownRenderer = jasmine.createSpyObj('MarkdownRenderer', ['render']);
    mockMarkdownRenderer.render.and.callFake((text: string) => Promise.resolve(`<p>${text}</p>`));

    await TestBed.configureTestingModule({
      imports: [TextComponent],
      providers: [
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Hello World'), raw: 'Hello World', onUpdate: () => {} },
    });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the markdown text', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Hello World'), raw: 'Hello World', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('span'));
    expect(span.nativeElement.innerHTML.trim()).toBe('<p>Hello World</p>');
    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('Hello World');
  });

  it('should handle variant h1', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Heading'), raw: 'Heading', onUpdate: () => {} },
      variant: { value: signal('h1'), raw: 'h1', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('# Heading');
  });

  it('should handle variant caption', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Caption'), raw: 'Caption', onUpdate: () => {} },
      variant: { value: signal('caption'), raw: 'caption', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('*Caption*');
  });

  it('should handle variant h2', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Heading'), raw: 'Heading', onUpdate: () => {} },
      variant: { value: signal('h2'), raw: 'h2', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('## Heading');
  });

  it('should handle variant h3', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Heading'), raw: 'Heading', onUpdate: () => {} },
      variant: { value: signal('h3'), raw: 'h3', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('### Heading');
  });

  it('should handle variant h4', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Heading'), raw: 'Heading', onUpdate: () => {} },
      variant: { value: signal('h4'), raw: 'h4', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('#### Heading');
  });

  it('should handle variant h5', async () => {
    fixture.componentRef.setInput('props', {
      text: { value: signal('Heading'), raw: 'Heading', onUpdate: () => {} },
      variant: { value: signal('h5'), raw: 'h5', onUpdate: () => {} },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('##### Heading');
  });

  it('should handle missing text property', async () => {
    fixture.componentRef.setInput('props', {});
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('');
  });
});

