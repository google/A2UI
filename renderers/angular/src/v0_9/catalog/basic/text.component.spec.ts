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

describe('TextComponent', () => {
  let component: TextComponent;
  let fixture: ComponentFixture<TextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('props', {
      text: { value: signal('Hello World'), raw: 'Hello World', onUpdate: () => {} },
      weight: { value: signal('bold'), raw: 'bold', onUpdate: () => {} },
      style: { value: signal('italic'), raw: 'italic', onUpdate: () => {} },
    });
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the text', () => {
    fixture.detectChanges();
    const span = fixture.debugElement.query(By.css('span'));
    expect(span.nativeElement.textContent.trim()).toBe('Hello World');
  });

  it('should apply font-weight and font-style', () => {
    fixture.detectChanges();
    const span = fixture.debugElement.query(By.css('span'));
    expect(span.styles['font-weight']).toBe('bold');
    expect(span.styles['font-style']).toBe('italic');
  });
});
