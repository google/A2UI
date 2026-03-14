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

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ColumnComponent } from './column.component';
import { ComponentHostComponent } from '../../core/component-host.component';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { AngularCatalog } from '../types';
import { ComponentBinder } from '../../core/component-binder.service';
import { By } from '@angular/platform-browser';
import { signal } from '@preact/signals-core';

describe('ColumnComponent', () => {
  let component: ColumnComponent;
  let fixture: ComponentFixture<ColumnComponent>;

  beforeEach(async () => {
    const mockRendererService = {
      surfaceGroup: {
        getSurface: jasmine.createSpy('getSurface').and.returnValue({
          componentsModel: new Map(),
        }),
      },
    };
    const mockCatalog = {
      components: new Map(),
    };
    const mockBinder = {
      bind: jasmine.createSpy('bind').and.returnValue({}),
    };

    await TestBed.configureTestingModule({
      imports: [ColumnComponent, ComponentHostComponent],
      providers: [
        { provide: A2uiRendererService, useValue: mockRendererService },
        { provide: AngularCatalog, useValue: mockCatalog },
        { provide: ComponentBinder, useValue: mockBinder },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnComponent);
    component = fixture.componentInstance;
    component.surfaceId = 'surf1';
  });

  it('should propagate dataContextPath to static children', () => {
    component.dataContextPath = '/parent/path';
    component.props = {
      children: {
        value: () => ['child1', 'child2'],
      },
    };

    fixture.detectChanges();

    const childHosts = fixture.debugElement.queryAll(By.directive(ComponentHostComponent));
    expect(childHosts.length).toBe(2);
    expect(childHosts[0].componentInstance.dataContextPath).toBe('/parent/path');
    expect(childHosts[1].componentInstance.dataContextPath).toBe('/parent/path');
  });

  it('should propagate correct dataContextPath to repeating children', () => {
    component.dataContextPath = '/list';
    const mockData = [{}, {}, {}];

    component.props = {
      children: {
        value: () => mockData,
        raw: { componentId: 'template-id' },
      },
    };

    fixture.detectChanges();

    const childHosts = fixture.debugElement.queryAll(By.directive(ComponentHostComponent));
    expect(childHosts.length).toBe(3);
    expect(childHosts[0].componentInstance.dataContextPath).toBe('/list/0');
    expect(childHosts[1].componentInstance.dataContextPath).toBe('/list/1');
    expect(childHosts[2].componentInstance.dataContextPath).toBe('/list/2');
    expect(childHosts[0].componentInstance.componentId).toBe('template-id');
  });
});
