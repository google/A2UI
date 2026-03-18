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

import { TestBed } from '@angular/core/testing';
import { MarkdownRenderer, provideMarkdownRenderer } from './markdown';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

describe('MarkdownRenderer', () => {
  let service: MarkdownRenderer;
  let sanitizer: DomSanitizer;

  const mockSanitizer = {
    bypassSecurityTrustHtml: (val: string) => val as any as SafeHtml,
    sanitize: (context: SecurityContext, val: any) => val as string,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MarkdownRenderer,
        {
          provide: DomSanitizer,
          useValue: mockSanitizer,
        },
      ],
    });
    service = TestBed.inject(MarkdownRenderer);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should render using custom renderer if provided', async () => {
    const mockRenderer = async (val: string) => `rendered: ${val}`;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MarkdownRenderer,
        provideMarkdownRenderer(mockRenderer),
        {
          provide: DomSanitizer,
          useValue: mockSanitizer,
        },
      ],
    });
    service = TestBed.inject(MarkdownRenderer);

    const result = await service.render('test');
    expect(result).toBe('rendered: test');
  });

  it('should return a fallback span if no renderer is provided', async () => {
    const spy = spyOn(console, 'warn');
    const result: any = await service.render('test');

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('span');
    expect(result).toContain('test');
    expect(result).toContain('no-markdown-renderer');
  });
});
