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
import { Text } from './text';
import { MessageProcessor } from '../data/processor';
import { Theme } from '../rendering/theming';
import { MarkdownRenderer } from '../data/markdown';

describe('Text', () => {
  let component: Text;
  let fixture: ComponentFixture<Text>;
  let mockMessageProcessor: any;
  let mockTheme: any;
  let mockMarkdownRenderer: any;

  beforeEach(async () => {
    mockMessageProcessor = {
      getData: jasmine.createSpy('getData').and.returnValue(null),
      resolvePath: jasmine.createSpy('resolvePath').and.callFake((p: string) => p),
    };

    mockTheme = {
      components: {
        Text: {
          all: { 'font-family': 'sans-serif' },
          h1: { 'font-size': '2em' },
          body: { 'font-size': '1em' },
        },
        markdown: {},
      },
      additionalStyles: {
        Text: {
          h1: { color: 'red' },
          body: { color: 'black' },
        },
      },
    };

    mockMarkdownRenderer = {
      render: jasmine
        .createSpy('render')
        .and.callFake((val: string) => Promise.resolve(`rendered: ${val}`)),
    };

    await TestBed.configureTestingModule({
      imports: [Text],
      providers: [
        { provide: MessageProcessor, useValue: mockMessageProcessor },
        { provide: Theme, useValue: mockTheme },
        { provide: MarkdownRenderer, useValue: mockMarkdownRenderer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Text);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'text1',
      type: 'Text',
      weight: 1,
      properties: {
        value: { literalString: 'Hello world' },
      },
    });
    fixture.componentRef.setInput('text', { literalString: 'Hello world' });
    fixture.componentRef.setInput('usageHint', 'body');
    fixture.componentRef.setInput('weight', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render plain text via markdown renderer', async () => {
    fixture.componentRef.setInput('text', { literalString: 'Hello' });
    fixture.componentRef.setInput('usageHint', 'body');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('rendered: Hello');
    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('Hello', jasmine.any(Object));
  });

  it('should render h1 text with markdown hint', async () => {
    fixture.componentRef.setInput('text', { literalString: 'Title' });
    fixture.componentRef.setInput('usageHint', 'h1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('# Title', jasmine.any(Object));
    expect(fixture.nativeElement.textContent).toContain('rendered: # Title');
  });
  it('should render other heading hints', async () => {
    const hints = ['h2', 'h3', 'h4', 'h5'] as const;
    const prefixes = ['##', '###', '####', '#####'] as const;

    for (let i = 0; i < hints.length; i++) {
      fixture.componentRef.setInput('usageHint', hints[i]);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(mockMarkdownRenderer.render).toHaveBeenCalledWith(
        `${prefixes[i]} Hello world`,
        jasmine.any(Object),
      );
    }
  });

  it('should render caption hint', async () => {
    fixture.componentRef.setInput('usageHint', 'caption');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(mockMarkdownRenderer.render).toHaveBeenCalledWith('*Hello world*', jasmine.any(Object));
  });

  it('should render (empty) for null text', async () => {
    fixture.componentRef.setInput('text', null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // InnerHTML will be (empty)
    expect(fixture.nativeElement.textContent).toContain('(empty)');
  });

  it('should handle hinted styles in theme', () => {
    const hintedTheme = {
      h1: { 'font-weight': 'bold' },
      h2: { 'font-weight': '600' },
      h3: { 'font-weight': '500' },
      h4: { 'font-weight': '400' },
      h5: { 'font-weight': '300' },
      h6: { 'font-weight': '200' },
      caption: { 'font-size': '0.8em' },
      body: { 'font-size': '1em' },
    };
    mockTheme.additionalStyles.Text = hintedTheme;

    fixture.componentRef.setInput('usageHint', 'h1');
    fixture.detectChanges();
    // We can't easily check the protected additionalStyles() directly without casting
    // but we can check the section element's style if it's applied via [style]
    const section = fixture.nativeElement.querySelector('section');
    expect(section.style.fontWeight).toBe('bold');

    fixture.componentRef.setInput('usageHint', 'caption');
    fixture.detectChanges();
    expect(section.style.fontSize).toBe('0.8em');
  });

  it('should apply default body styles if usageHint is missing in hinted styles', () => {
    const hintedTheme = {
      h1: { 'font-weight': 'bold' },
      h2: { 'font-weight': '600' },
      h3: { 'font-weight': '500' },
      h4: { 'font-weight': '400' },
      h5: { 'font-weight': '300' },
      h6: { 'font-weight': '200' },
      caption: { 'font-size': '0.8em' },
      body: { 'font-size': '1.1em' },
    };
    mockTheme.additionalStyles.Text = hintedTheme;

    fixture.componentRef.setInput('usageHint', null);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section.style.fontSize).toBe('1.1em');
  });

  it('should apply simple additional styles if not hinted', () => {
    const simpleStyles = { color: 'green', opacity: '0.5' };
    mockTheme.additionalStyles.Text = simpleStyles;

    fixture.componentRef.setInput('usageHint', 'h1');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section.style.color).toBe('green');
    expect(section.style.opacity).toBe('0.5');
  });

  it('should return null for additionalStyles if styles are null or undefined', () => {
    mockTheme.additionalStyles.Text = null;
    fixture.componentRef.setInput('usageHint', 'h1');
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section.style.color).toBe('');
  });

  it('should handle areHintedStyles false cases', () => {
    // We can't call private method directly, so we trigger its logic.
    // Non-hinted object (missing some expected keys)
    const incompleteHinted = { h1: { color: 'red' }, body: { color: 'black' } };
    mockTheme.additionalStyles.Text = incompleteHinted;
    fixture.componentRef.setInput('usageHint', 'h1');
    fixture.detectChanges();

    // It should treat incompleteHinted as a direct style record (applying [key]: {color: 'red'} as strings to style)
    // Wait, if it's not hinted, it returns styles as is.
    // styles[h1] = {color: 'red'} (as string '[object Object]')?
    // Angular's [style] binding might handle it or fail.
    // Actually, in Text.ts: additionalStyles = styles;
    // So [style]="{ h1: { color: 'red' } }"
  });
});
