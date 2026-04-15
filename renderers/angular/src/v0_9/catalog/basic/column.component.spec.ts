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
import { Component, input, signal } from '@angular/core';
import { ColumnComponent } from './column.component';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { ComponentBinder } from '../../core/component-binder.service';
import { By } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'dummy-child',
  template: 'Dummy Child',
})
class DummyChild {
  props = input<any>();
  surfaceId = input<string>();
  componentId = input<string>();
  dataContextPath = input<string>();
}

describe('ColumnComponent', () => {
  let component: ColumnComponent;
  let fixture: ComponentFixture<ColumnComponent>;
  let mockRendererService: any;
  let mockSurface: any;
  let mockSurfaceGroup: any;
  let mockBinder: any;

  beforeEach(async () => {
    mockSurface = {
      componentsModel: new Map([
        ['child1', { id: 'child1', type: 'Child', properties: {} }],
        ['child2', { id: 'child2', type: 'Child', properties: {} }],
        ['template1', { id: 'template1', type: 'Child', properties: {} }],
      ]),
      catalog: {
        id: 'test-catalog',
        components: new Map([['Child', { component: DummyChild }]]),
      },
    };

    mockSurfaceGroup = {
      getSurface: jasmine.createSpy('getSurface').and.returnValue(mockSurface),
    };

    mockRendererService = {
      surfaceGroup: mockSurfaceGroup,
    };

    mockBinder = jasmine.createSpyObj('ComponentBinder', ['bind']);
    mockBinder.bind.and.returnValue({ text: { value: () => 'bound' } });

    await TestBed.configureTestingModule({
      imports: [ColumnComponent],
      providers: [
        { provide: A2uiRendererService, useValue: mockRendererService },
        { provide: ComponentBinder, useValue: mockBinder },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('surfaceId', 'surf1');
    fixture.componentRef.setInput('props', {
      justify: { value: signal('start'), raw: 'start', onUpdate: () => {} },
      align: { value: signal('stretch'), raw: 'stretch', onUpdate: () => {} },
      children: {
        value: signal(['child1', 'child2']),
        raw: ['child1', 'child2'],
        onUpdate: () => {},
      },
    });
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should apply flex styles from props', () => {
    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('.a2ui-column'));
    expect(div.styles['justify-content']).toBe('start');
    expect(div.styles['align-items']).toBe('stretch');
    expect(div.styles['gap']).toBe('4px');
  });

  it('should render non-repeating children', () => {
    fixture.detectChanges();
    const hosts = fixture.debugElement.queryAll(By.css('a2ui-v09-component-host'));
    expect(hosts.length).toBe(2);
    expect(hosts[0].componentInstance.componentKey()).toEqual({ id: 'child1', basePath: '/' });
    expect(hosts[1].componentInstance.componentKey()).toEqual({ id: 'child2', basePath: '/' });
  });

  it('should render repeating children', () => {
    fixture.componentRef.setInput('props', {
      ...component.props(),
      children: {
        value: signal([{}, {}]),
        raw: {
          componentId: 'template1',
          path: 'items',
        },
        onUpdate: () => {},
      },
    });
    fixture.detectChanges();

    const hosts = fixture.debugElement.queryAll(By.css('a2ui-v09-component-host'));
    expect(hosts.length).toBe(2);
    expect(hosts[0].componentInstance.componentKey()).toEqual({ id: 'template1', basePath: '/items/0' });
    expect(hosts[1].componentInstance.componentKey()).toEqual({ id: 'template1', basePath: '/items/1' });
  });

  it('should handle non-array children value', () => {
    fixture.componentRef.setInput('props', {
      ...component.props(),
      children: {
        value: signal('not-an-array'),
        raw: 'not-an-array',
        onUpdate: () => {},
      },
    });
    fixture.detectChanges();
    const hosts = fixture.debugElement.queryAll(By.css('a2ui-v09-component-host'));
    expect(hosts.length).toBe(0);
  });

  it('should handle missing children property', () => {
    fixture.componentRef.setInput('props', {
      justify: { value: signal('start'), raw: 'start', onUpdate: () => {} },
      align: { value: signal('stretch'), raw: 'stretch', onUpdate: () => {} },
    });
    fixture.detectChanges();
    const hosts = fixture.debugElement.queryAll(By.css('a2ui-v09-component-host'));
    expect(hosts.length).toBe(0);
  });

  it('should handle missing justify and align properties', () => {
    fixture.componentRef.setInput('props', {
      children: {
        value: signal(['child1']),
        raw: ['child1'],
        onUpdate: () => {},
      },
    });
    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('.a2ui-column'));
    expect(div.styles['justify-content']).toBeFalsy();
    expect(div.styles['align-items']).toBeFalsy();
  });
});

