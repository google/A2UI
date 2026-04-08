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
import { By } from '@angular/platform-browser';
import { ComponentHostComponent } from './component-host.component';
import { A2uiRendererService } from './a2ui-renderer.service';
import { ComponentBinder } from './component-binder.service';
import { ComponentContext } from '@a2ui/web_core/v0_9';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'test-child',
  template: '<div>Child Component</div>',
})
class TestChildComponent {
  @Input() props: any;
  @Input() surfaceId?: string;
  @Input() componentId?: string;
  @Input() dataContextPath?: string;
}

describe('ComponentHostComponent', () => {
  let component: ComponentHostComponent;
  let fixture: ComponentFixture<ComponentHostComponent>;
  let mockRendererService: any;
  let mockCatalog: any;
  let mockBinder: jasmine.SpyObj<ComponentBinder>;
  let mockSurface: any;
  let mockSurfaceGroup: any;

  beforeEach(async () => {
    mockCatalog = {
      id: 'test-catalog',
      components: new Map([['TestType', { component: TestChildComponent }]]),
    };

    const compMap = new Map([
      ['comp1', { id: 'comp1', type: 'TestType', properties: { text: 'Hello' } }],
    ]);
    const mockOnCreated = jasmine.createSpyObj('onCreated', ['subscribe']);
    mockOnCreated.subscribe.and.returnValue({ unsubscribe: () => {} });

    mockSurface = {
      componentsModel: {
        get: (id: string) => compMap.get(id),
        clear: () => compMap.clear(),
        onCreated: mockOnCreated,
      },
      catalog: mockCatalog,
    };

    mockSurfaceGroup = {
      getSurface: jasmine.createSpy('getSurface').and.returnValue(mockSurface),
    };

    mockRendererService = {
      surfaceGroup: mockSurfaceGroup,
    };

    mockBinder = jasmine.createSpyObj('ComponentBinder', ['bind']);
    mockBinder.bind.and.returnValue({
      text: { value: () => 'bound-hello', onUpdate: () => {} } as any,
    });

    await TestBed.configureTestingModule({
      imports: [ComponentHostComponent],
      providers: [
        { provide: A2uiRendererService, useValue: mockRendererService },
        { provide: ComponentBinder, useValue: mockBinder },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentHostComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('componentKey', { id: 'comp1', basePath: '/' });
    fixture.componentRef.setInput('surfaceId', 'surf1');
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should resolve component type and bind props', () => {
      fixture.detectChanges(); // Triggers ngOnInit

      // @ts-ignore - Accessing protected property
      expect(component.componentType).toBe(TestChildComponent);
      // @ts-ignore - Accessing protected property
      expect(component.props).toEqual({
        text: jasmine.objectContaining({ value: jasmine.any(Function) }) as any,
      });

      expect(mockSurfaceGroup.getSurface).toHaveBeenCalledWith('surf1');
      expect(mockBinder.bind).toHaveBeenCalled();

      // Verify context creation implicitly by checking if bind was called with a ComponentContext
      const bindArg = mockBinder.bind.calls.mostRecent().args[0];
      expect(bindArg).toBeInstanceOf(ComponentContext);
      expect(bindArg.componentModel.id).toBe('comp1');
      expect(bindArg.dataContext.path).toBe('/');
    });

    it('should use provided dataContextPath for ComponentContext', () => {
      fixture.componentRef.setInput('componentKey', { id: 'comp1', basePath: '/nested/path' });
      fixture.detectChanges();

      const bindArg = mockBinder.bind.calls.mostRecent().args[0];
      expect(bindArg.dataContext.path).toBe('/nested/path');
    });

    it('should warn and return if surface not found', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      mockSurfaceGroup.getSurface.and.returnValue(null);

      fixture.detectChanges();

      // @ts-ignore
      expect(component.componentType).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Surface surf1 not found');
    });

    it('should warn and return if component model not found', () => {
      const consoleWarnSpy = spyOn(console, 'warn');
      mockSurface.componentsModel.clear();

      fixture.detectChanges();

      // @ts-ignore
      expect(component.componentType).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Component comp1 not found in surface surf1. Waiting for it...');
    });

    it('should error and return if component type not in catalog', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      mockCatalog.components.clear();

      fixture.detectChanges();

      // @ts-ignore
      expect(component.componentType).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Component type "TestType" not found in catalog "test-catalog"',
      );
    });

    it('should trigger destroyRef on destroy', () => {
      fixture.detectChanges(); // Trigger ngOnInit

      // Destroy fixture
      fixture.destroy();

      // Implicitly verifies no crash on destroy
      expect(component).toBeTruthy();
    });
  });

  describe('Template rendering', () => {
    it('should render the resolved component', () => {
      fixture.detectChanges(); // Triggers ngOnInit and render

      const compiled = fixture.nativeElement;
      expect(compiled.innerHTML).toContain('Child Component');
    });
    it('should pass dataContextPath to the rendered component', () => {
      fixture.componentRef.setInput('componentKey', { id: 'comp1', basePath: '/some/path' });
      fixture.detectChanges();

      const childDebugElement = fixture.debugElement.query(By.directive(TestChildComponent));
      expect(childDebugElement).toBeTruthy();
      const childInstance = childDebugElement.componentInstance as TestChildComponent;
      expect(childInstance.dataContextPath).toBe('/some/path');
    });
  });
});
