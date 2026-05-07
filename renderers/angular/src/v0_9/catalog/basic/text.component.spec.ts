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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TextComponent} from './text.component';
import {By} from '@angular/platform-browser';
import {MarkdownRenderer} from '../../core/markdown';
import {setComponentProps, createBoundProperty, ComponentToProps} from '../../core/test-utils';
import {A2uiRendererService, A2UI_RENDERER_CONFIG} from '../../core/a2ui-renderer.service';

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;
  let mockMarkdownRenderer: jasmine.SpyObj<MarkdownRenderer>;
  let defaultProps: ComponentToProps<TextComponent>;

  beforeEach(async () => {
    mockMarkdownRenderer = jasmine.createSpyObj('MarkdownRenderer', ['render']);
    mockMarkdownRenderer.render.and.callFake((text: string) => Promise.resolve(`<p>${text}</p>`));

    await TestBed.configureTestingModule({
      imports: [TextComponent],
      providers: [
        {provide: MarkdownRenderer, useValue: mockMarkdownRenderer},
        A2uiRendererService,
        {provide: A2UI_RENDERER_CONFIG, useValue: {catalogs: []}},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('surfaceId', 'surf1');

    defaultProps = {
      text: createBoundProperty('Hello World'),
    };
    setComponentProps(fixture, defaultProps);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the markdown text', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const span = fixture.debugElement.query(By.css('span'));
    expect(span.nativeElement.innerHTML.trim()).toBe('<p>Hello World</p>');
    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('Hello World');
  });

  it('should handle variant h1', async () => {
    setComponentProps(fixture, {
      text: createBoundProperty('Heading'),
      variant: createBoundProperty('h1' as const),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('# Heading');
  });

  it('should handle variant caption', async () => {
    setComponentProps(fixture, {
      text: createBoundProperty('Caption'),
      variant: createBoundProperty('caption' as const),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('*Caption*');
  });

  it('should handle variant h2', async () => {
    setComponentProps(fixture, {
      text: createBoundProperty('Heading'),
      variant: createBoundProperty('h2' as const),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('## Heading');
  });

  it('should handle variant h3', async () => {
    setComponentProps(fixture, {
      text: createBoundProperty('Heading'),
      variant: createBoundProperty('h3' as const),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('### Heading');
  });

  it('should handle variant h4', async () => {
    setComponentProps(fixture, {
      text: createBoundProperty('Heading'),
      variant: createBoundProperty('h4' as const),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('#### Heading');
  });

  it('should handle variant h5', async () => {
    setComponentProps(fixture, {
      text: createBoundProperty('Heading'),
      variant: createBoundProperty('h5' as const),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('##### Heading');
  });

  it('should handle missing text property', async () => {
    setComponentProps(fixture, {} as ComponentToProps<TextComponent>);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('');
  });
});
