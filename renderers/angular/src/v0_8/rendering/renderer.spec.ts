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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Renderer } from './renderer';
import { Catalog } from './catalog';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'test-comp',
  template: '<div>{{text}}</div>',
  standalone: true,
})
class TestComp {
  @Input() surfaceId?: string;
  @Input() component?: any;
  @Input() weight?: number;
  @Input() text?: string;
}

describe('v0.8 Renderer', () => {
  let component: Renderer;
  let fixture: ComponentFixture<Renderer>;
  let mockCatalog: any;

  beforeEach(async () => {
    mockCatalog = {
      TestComp: { type: () => TestComp },
    };

    await TestBed.configureTestingModule({
      imports: [Renderer],
      providers: [{ provide: Catalog, useValue: mockCatalog }],
    }).compileComponents();

    fixture = TestBed.createComponent(Renderer);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render component from catalog', async () => {
    fixture.componentRef.setInput('surfaceId', 'surf-1');
    fixture.componentRef.setInput('component', {
      type: 'TestComp',
      properties: { text: 'Hello v0.8' },
      weight: 10,
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Hello v0.8');
  });

  it('should handle async component resolution', async () => {
    mockCatalog['TestComp'] = () => Promise.resolve(TestComp);

    fixture.componentRef.setInput('surfaceId', 'surf-1');
    fixture.componentRef.setInput('component', {
      type: 'TestComp',
      properties: { text: 'Async Hello' },
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Async Hello');
  });

  it('should error if component type not found', () => {
    const consoleSpy = spyOn(console, 'error');
    fixture.componentRef.setInput('surfaceId', 'surf-1');
    fixture.componentRef.setInput('component', {
      type: 'UnknownComp',
      properties: {},
    });

    fixture.detectChanges();
    expect(consoleSpy).toHaveBeenCalledWith('Unknown component type: UnknownComp');
  });

  it('should handle direct function config in catalog', async () => {
    mockCatalog['TestComp'] = () => TestComp;

    fixture.componentRef.setInput('surfaceId', 'surf-1');
    fixture.componentRef.setInput('component', {
      type: 'TestComp',
      properties: { text: 'Function Hello' },
    });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Function Hello');
  });
});
