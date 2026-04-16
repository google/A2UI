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
import { Component, signal as angularSignal, input } from '@angular/core';
import { CheckBoxComponent } from './check-box.component';
import { ChoicePickerComponent } from './choice-picker.component';
import { SliderComponent } from './slider.component';
import { DateTimeInputComponent } from './date-time-input.component';
import { ListComponent } from './list.component';
import { TabsComponent } from './tabs.component';
import { ComponentModel } from '@a2ui/web_core/v0_9';
import { ModalComponent } from './modal.component';
import { BoundProperty } from '../../core/types';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { ComponentBinder } from '../../core/component-binder.service';
import { By } from '@angular/platform-browser';

describe('Complex Components', () => {
  let mockRendererService: any;
  let mockBinder: any;

  beforeEach(() => {
    mockRendererService = {
      surfaceGroup: {
        getSurface: jasmine.createSpy('getSurface').and.returnValue({
          componentsModel: new Map([
            ['child-1', new ComponentModel('child-1', 'Text', { text: { value: 'Child 1' } })],
            ['child-2', new ComponentModel('child-2', 'Text', { text: { value: 'Child 2' } })],
            ['content-1', new ComponentModel('content-1', 'Text', { text: { value: 'Content 1' } })],
            ['content-2', new ComponentModel('content-2', 'Text', { text: { value: 'Content 2' } })],
            ['trigger-btn', new ComponentModel('trigger-btn', 'Text', { text: { value: 'Open' } })],
            ['modal-content', new ComponentModel('modal-content', 'Text', { text: { value: 'Modal' } })],
          ]),
          catalog: {
            id: 'mock-catalog',
            components: new Map([['Text', { type: 'Text', component: DummyTextComponent }]]),
          },
        }),
      },
    };
    mockBinder = jasmine.createSpyObj('ComponentBinder', ['bind']);
  });

  @Component({
    selector: 'dummy-text',
    template: '<div>{{text}}</div>',
    standalone: true,
  })
  class DummyTextComponent {
    text?: string;
    props = input<any>();
    surfaceId = input<string>();
    componentId = input<string>();
    dataContextPath = input<string>();
  }

  function createBoundProperty(val: any): BoundProperty<any> {
    return {
      value: angularSignal(val),
      raw: val,
      onUpdate: jasmine.createSpy('onUpdate'),
    };
  }

  describe('CheckBoxComponent', () => {
    let component: CheckBoxComponent;
    let fixture: ComponentFixture<CheckBoxComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CheckBoxComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CheckBoxComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should show label and checked state', () => {
      fixture.componentRef.setInput('props', {
        label: createBoundProperty('Check me'),
        value: createBoundProperty(true),
      });
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.checked).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Check me');
    });

    it('should call onUpdate when toggled', () => {
      const onUpdateSpy = jasmine.createSpy('onUpdate');
      fixture.componentRef.setInput('props', {
        label: createBoundProperty('Check me'),
        value: { value: angularSignal(false), raw: false, onUpdate: onUpdateSpy },
      });
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      input.click();
      expect(onUpdateSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('ChoicePickerComponent', () => {
    let component: ChoicePickerComponent;
    let fixture: ComponentFixture<ChoicePickerComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ChoicePickerComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChoicePickerComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('componentId', 'test-choice-picker');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render options', () => {
      fixture.componentRef.setInput('props', {
        label: createBoundProperty('Pick one'),
        options: createBoundProperty([
          { label: 'Opt 1', value: '1' },
          { label: 'Opt 2', value: '2' },
        ]),
        value: createBoundProperty('1'),
        variant: createBoundProperty('mutuallyExclusive'),
        displayStyle: createBoundProperty('checkbox'),
      });
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.a2ui-option-label');
      expect(options.length).toBe(2);
      expect(options[0].textContent).toContain('Opt 1');
    });

    it('should call onUpdate when option selected', () => {
      const onUpdateSpy = jasmine.createSpy('onUpdate');
      fixture.componentRef.setInput('props', {
        label: createBoundProperty('Pick one'),
        options: createBoundProperty([
          { label: 'Opt 1', value: '1' },
          { label: 'Opt 2', value: '2' },
        ]),
        value: { value: angularSignal('1'), raw: '1', onUpdate: onUpdateSpy },
        variant: createBoundProperty('mutuallyExclusive'),
        displayStyle: createBoundProperty('checkbox'),
      });
      fixture.detectChanges();
      const inputs = fixture.nativeElement.querySelectorAll('input');
      inputs[1].click();
      expect(onUpdateSpy).toHaveBeenCalledWith('2');
    });

    it('should render chips and toggle selection', () => {
      const onUpdateSpy = jasmine.createSpy('onUpdate');
      fixture.componentRef.setInput('props', {
        choices: createBoundProperty([
          { label: 'Chip 1', value: 'c1' },
          { label: 'Chip 2', value: 'c2' },
        ]),
        value: { value: angularSignal(['c1']), raw: ['c1'], onUpdate: onUpdateSpy },
        variant: createBoundProperty('multipleSelection'),
        displayStyle: createBoundProperty('chips'),
      });
      fixture.detectChanges();
      const chips = fixture.nativeElement.querySelectorAll('.a2ui-chip');
      expect(chips.length).toBe(2);
      expect(chips[0].classList.contains('active')).toBeTrue();
      expect(chips[1].classList.contains('active')).toBeFalse();

      chips[1].click();
      expect(onUpdateSpy).toHaveBeenCalledWith(['c1', 'c2']);

      chips[0].click();
      expect(onUpdateSpy).toHaveBeenCalledWith([]);
    });
  });

  describe('SliderComponent', () => {
    let component: SliderComponent;
    let fixture: ComponentFixture<SliderComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SliderComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(SliderComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render slider with value', () => {
      fixture.componentRef.setInput('props', {
        label: createBoundProperty('Brightness'),
        min: createBoundProperty(0),
        max: createBoundProperty(100),
        value: createBoundProperty(50),
      });
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      expect(input.value).toBe('50');
      expect(fixture.nativeElement.textContent).toContain('Brightness');
    });

    it('should call onUpdate when slider value changes', () => {
      const onUpdateSpy = jasmine.createSpy('onUpdate');
      fixture.componentRef.setInput('props', {
        value: { value: angularSignal(50), raw: 50, onUpdate: onUpdateSpy },
      });
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input');
      input.value = '75';
      input.dispatchEvent(new Event('input'));
      expect(onUpdateSpy).toHaveBeenCalledWith(75);
    });
  });

  describe('DateTimeInputComponent', () => {
    let component: DateTimeInputComponent;
    let fixture: ComponentFixture<DateTimeInputComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DateTimeInputComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DateTimeInputComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render date input', () => {
      fixture.componentRef.setInput('props', {
        label: createBoundProperty('Start Date'),
        value: createBoundProperty('2026-03-16'),
        enableDate: createBoundProperty(true),
        enableTime: createBoundProperty(false),
      });
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input[type="date"]');
      expect(input).toBeTruthy();
      expect(input.value).toBe('2026-03-16');
    });

    it('should call onUpdate when date or time changes', () => {
      const onUpdateSpy = jasmine.createSpy('onUpdate');
      fixture.componentRef.setInput('props', {
        value: {
          value: angularSignal('2026-03-16T10:00:00'),
          raw: '2026-03-16T10:00:00',
          onUpdate: onUpdateSpy,
        },
        enableDate: createBoundProperty(true),
        enableTime: createBoundProperty(true),
      });
      fixture.detectChanges();
      const dateInput = fixture.nativeElement.querySelector('input[type="date"]');
      const timeInput = fixture.nativeElement.querySelector('input[type="time"]');

      dateInput.value = '2026-03-17';
      dateInput.dispatchEvent(new Event('change'));
      expect(onUpdateSpy).toHaveBeenCalled();

      onUpdateSpy.calls.reset();
      timeInput.value = '11:00';
      timeInput.dispatchEvent(new Event('change'));
      expect(onUpdateSpy).toHaveBeenCalled();
    });

    it('should handle empty value by returning empty strings', () => {
      fixture.componentRef.setInput('props', {
        value: createBoundProperty(''),
        enableDate: createBoundProperty(true),
        enableTime: createBoundProperty(true),
      });
      fixture.detectChanges();
      
      const dateInput = fixture.nativeElement.querySelector('input[type="date"]');
      const timeInput = fixture.nativeElement.querySelector('input[type="time"]');
      
      expect(dateInput.value).toBe('');
      expect(timeInput.value).toBe('');
    });
  });



  describe('ListComponent', () => {
    let component: ListComponent;
    let fixture: ComponentFixture<ListComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ListComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ListComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render children', () => {
      fixture.componentRef.setInput('props', {
        children: createBoundProperty(['child-1', 'child-2']),
        direction: createBoundProperty('vertical'),
      });
      fixture.detectChanges();
      const hosts = fixture.nativeElement.querySelectorAll('a2ui-v09-component-host');
      expect(hosts.length).toBe(2);
    });

    it('should render as ordered list', () => {
      fixture.componentRef.setInput('props', {
        children: createBoundProperty(['child-1']),
        listStyle: createBoundProperty('ordered'),
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ol')).toBeTruthy();
    });

    it('should render as unordered list', () => {
      fixture.componentRef.setInput('props', {
        children: createBoundProperty(['child-1']),
        listStyle: createBoundProperty('unordered'),
      });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ul')).toBeTruthy();
    });

    it('should render fallback list when style is not list style', () => {
      fixture.componentRef.setInput('props', {
        children: createBoundProperty(['child-1']),
        listStyle: createBoundProperty('div'),
      });
      fixture.detectChanges();
      const divList = fixture.nativeElement.querySelector('.a2ui-list');
      expect(divList.tagName.toLowerCase()).toBe('div');
    });

    it('should handle non-array children', () => {
      fixture.componentRef.setInput('props', {
        children: createBoundProperty('not-an-array'),
      });
      fixture.detectChanges();
      expect(component.children()).toEqual([]);
    });

    it('should handle missing children property', () => {
      fixture.componentRef.setInput('props', {});
      fixture.detectChanges();
      expect(component.children()).toEqual([]);
    });

    it('should apply horizontal orientation class', () => {
      fixture.componentRef.setInput('props', {
        children: createBoundProperty(['child-1']),
        orientation: createBoundProperty('horizontal'),
      });
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.a2ui-list');
      expect(list.classList).toContain('horizontal');
    });
  });

  describe('TabsComponent', () => {
    let component: TabsComponent;
    let fixture: ComponentFixture<TabsComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TabsComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TabsComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render tabs and switch content', () => {
      fixture.componentRef.setInput('props', {
        tabs: createBoundProperty([
          { label: 'Tab 1', content: 'content-1' },
          { label: 'Tab 2', content: 'content-2' },
        ]),
      });
      fixture.detectChanges();
      const tabs = fixture.nativeElement.querySelectorAll('.a2ui-tab-button');
      expect(tabs.length).toBe(2);
      expect(tabs[0].textContent).toContain('Tab 1');

      let host = fixture.debugElement.query(By.css('a2ui-v09-component-host'));
      expect(host.componentInstance.componentKey()).toEqual({ id: 'content-1', basePath: '/' });

      tabs[1].click();
      fixture.detectChanges();
      host = fixture.debugElement.query(By.css('a2ui-v09-component-host'));
      expect(host.componentInstance.componentKey()).toEqual({ id: 'content-2', basePath: '/' });
    });

    it('should handle missing tabs property', () => {
      fixture.componentRef.setInput('props', {});
      fixture.detectChanges();
      expect(component.tabs()).toEqual([]);
      expect(fixture.nativeElement.querySelectorAll('.a2ui-tab-button').length).toBe(0);
    });

    it('should handle empty tabs array', () => {
      fixture.componentRef.setInput('props', {
        tabs: createBoundProperty([]),
      });
      fixture.detectChanges();
      expect(component.tabs()).toEqual([]);
      expect(fixture.nativeElement.querySelectorAll('.a2ui-tab-button').length).toBe(0);
    });
  });

  describe('ModalComponent', () => {
    let component: ModalComponent;
    let fixture: ComponentFixture<ModalComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ModalComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ModalComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render trigger and open modal on click', () => {
      fixture.componentRef.setInput('props', {
        trigger: createBoundProperty({ id: 'trigger-btn', basePath: '/' }),
        content: createBoundProperty({ id: 'modal-content', basePath: '/' }),
      });
      fixture.detectChanges();
      const triggerHost = fixture.debugElement.query(
        By.css('.a2ui-modal-trigger a2ui-v09-component-host'),
      );
      expect(triggerHost.componentInstance.componentKey()).toEqual({ id: 'trigger-btn', basePath: '/' });

      expect(fixture.nativeElement.querySelector('.a2ui-modal-overlay')).toBeFalsy();

      fixture.nativeElement.querySelector('.a2ui-modal-trigger').click();
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.a2ui-modal-overlay');
      expect(overlay).toBeTruthy();
      const contentHost = fixture.debugElement.query(
        By.css('.a2ui-modal-overlay a2ui-v09-component-host'),
      );
      expect(contentHost.componentInstance.componentKey()).toEqual({ id: 'modal-content', basePath: '/' });
    });

    it('should close modal when close button clicked', () => {
      fixture.componentRef.setInput('props', {
        trigger: createBoundProperty({ id: 'trigger-btn', basePath: '/' }),
        content: createBoundProperty({ id: 'modal-content', basePath: '/' }),
      });
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.a2ui-modal-trigger').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.a2ui-modal-overlay')).toBeTruthy();

      fixture.nativeElement.querySelector('.a2ui-modal-close').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.a2ui-modal-overlay')).toBeFalsy();
    });

    it('should close modal when overlay clicked', () => {
      fixture.componentRef.setInput('props', {
        trigger: createBoundProperty({ id: 'trigger-btn', basePath: '/' }),
        content: createBoundProperty({ id: 'modal-content', basePath: '/' }),
      });
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.a2ui-modal-trigger').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.a2ui-modal-overlay')).toBeTruthy();

      fixture.nativeElement.querySelector('.a2ui-modal-overlay').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.a2ui-modal-overlay')).toBeFalsy();
    });

    it('should handle missing trigger or content', () => {
      fixture.componentRef.setInput('props', {});
      fixture.detectChanges();
      expect(component.trigger()).toBeUndefined();
      expect(component.content()).toBeUndefined();
      expect(fixture.nativeElement.querySelector('a2ui-v09-component-host')).toBeFalsy();
    });
  });
});
