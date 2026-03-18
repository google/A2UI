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

import { Component, PLATFORM_ID, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Renderer as A2uiRenderer } from './renderer';
import { Catalog } from './catalog';
import { DOCUMENT } from '@angular/common';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'a2ui-mock-comp',
  standalone: true,
  template: '',
})
class MockComponent {
  @Input() surfaceId?: any;
  @Input() component?: any;
  @Input() weight?: any;
}

@Component({
  template: `
    <ng-container a2ui-renderer [surfaceId]="surfaceId" [component]="componentNode"></ng-container>
  `,
  imports: [A2uiRenderer],
  standalone: true,
})
class TestHostComponent {
  @Input() surfaceId = 'surface-1';
  @Input() componentNode: any = { id: 'comp-1', type: 'button' };
}

describe('Renderer (v0.8)', () => {
  let hostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let mockCatalog: any;

  beforeEach(async () => {
    mockCatalog = {
      button: () => Promise.resolve(MockComponent),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: Catalog, useValue: mockCatalog },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(hostComponent).toBeTruthy();
  });

  it('should render component from catalog', async () => {
    hostComponent.surfaceId = 'surface-1';
    hostComponent.componentNode = { id: 'comp-1', type: 'button' };
    fixture.detectChanges();

    // Wait for async render
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();

    const mockComp = fixture.debugElement.query(By.directive(MockComponent));
    expect(mockComp).toBeTruthy('Mock component should be rendered');
    expect(mockComp.componentInstance.surfaceId).toBe('surface-1');
  });

  it('should clear old component before rendering new one', async () => {
    // Render first component
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('componentNode', { id: 'comp-1', type: 'button' });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();

    const comps1 = fixture.debugElement.queryAll(By.directive(MockComponent));
    expect(comps1.length).toBe(1, 'Expected exactly one component after first render');
    expect(comps1[0].componentInstance.component.id).toBe('comp-1');

    // Render second component
    fixture.componentRef.setInput('componentNode', { id: 'comp-2', type: 'button' });
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();

    const comps2 = fixture.debugElement.queryAll(By.directive(MockComponent));
    expect(comps2.length).toBe(1, 'Expected exactly one component after update');
    expect(comps2[0].componentInstance.component.id).toBe('comp-2');
  });
});
