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
import { Component, signal as angularSignal, signal, input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DividerComponent } from './divider.component';
import { ImageComponent } from './image.component';
import { IconComponent } from './icon.component';
import { VideoComponent } from './video.component';
import { AudioPlayerComponent } from './audio-player.component';
import { CardComponent } from './card.component';
import { BoundProperty } from '../../core/types';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { ComponentBinder } from '../../core/component-binder.service';

describe('Simple Components', () => {
  let mockRendererService: any;
  let mockBinder: any;

  beforeEach(() => {
    mockRendererService = {
      surfaceGroup: {
        getSurface: jasmine.createSpy('getSurface').and.returnValue({
          componentsModel: new Map([
            [
              'child-1',
              { id: 'child-1', type: 'Text', properties: { text: { value: 'Child 1' } } },
            ],
            [
              'child-2',
              { id: 'child-2', type: 'Text', properties: { text: { value: 'Child 2' } } },
            ],
            [
              'content-1',
              { id: 'content-1', type: 'Text', properties: { text: { value: 'Content 1' } } },
            ],
            [
              'content-2',
              { id: 'content-2', type: 'Text', properties: { text: { value: 'Content 2' } } },
            ],
            [
              'trigger-btn',
              { id: 'trigger-btn', type: 'Text', properties: { text: { value: 'Open' } } },
            ],
            [
              'modal-content',
              { id: 'modal-content', type: 'Text', properties: { text: { value: 'Modal' } } },
            ],
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

  describe('DividerComponent', () => {
    let component: DividerComponent;
    let fixture: ComponentFixture<DividerComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DividerComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(DividerComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render horizontal divider by default', () => {
      fixture.componentRef.setInput('props', {
        axis: createBoundProperty('horizontal'),
      });
      fixture.detectChanges();
      const divider = fixture.nativeElement.querySelector('.a2ui-divider');
      expect(divider.classList).toContain('horizontal');
    });

    it('should render vertical divider', () => {
      fixture.componentRef.setInput('props', {
        axis: createBoundProperty('vertical'),
      });
      fixture.detectChanges();
      const divider = fixture.nativeElement.querySelector('.a2ui-divider');
      expect(divider.classList).toContain('vertical');
    });
  });

  describe('ImageComponent', () => {
    let component: ImageComponent;
    let fixture: ComponentFixture<ImageComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ImageComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(ImageComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render image with url', () => {
      fixture.componentRef.setInput('props', {
        url: createBoundProperty('https://example.com/image.png'),
        fit: createBoundProperty('cover'),
        variant: createBoundProperty('avatar'),
      });
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.src).toBeTruthy();
      expect(img.style.objectFit).toBe('cover');
      expect(img.className).toContain('avatar');
    });

    it('should render image with description', () => {
      fixture.componentRef.setInput('props', {
        url: createBoundProperty('https://example.com/image.png'),
        description: createBoundProperty('A cute cat'),
      });
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('A cute cat');
    });
  });

  describe('IconComponent', () => {
    let component: IconComponent;
    let fixture: ComponentFixture<IconComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [IconComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(IconComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render named icon', () => {
      fixture.componentRef.setInput('props', {
        name: createBoundProperty('search'),
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('search');
    });

    it('should render path icon', () => {
      fixture.componentRef.setInput('props', {
        name: createBoundProperty({ path: 'M10 10...' }),
      });
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('VideoComponent', () => {
    let component: VideoComponent;
    let fixture: ComponentFixture<VideoComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VideoComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(VideoComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render video with url', () => {
      fixture.componentRef.setInput('props', {
        url: createBoundProperty('https://example.com/video.mp4'),
        posterUrl: createBoundProperty('https://example.com/poster.jpg'),
      });
      fixture.detectChanges();
      const video = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
      expect(video.src).toBeTruthy();
      expect(video.poster).toContain('poster.jpg');
    });

    it('should handle missing props', () => {
      fixture.componentRef.setInput('props', {});
      fixture.detectChanges();
      const video = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
      expect(video.getAttribute('src')).toBeFalsy();
    });
  });

  describe('AudioPlayerComponent', () => {
    let component: AudioPlayerComponent;
    let fixture: ComponentFixture<AudioPlayerComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AudioPlayerComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(AudioPlayerComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render audio with url', () => {
      fixture.componentRef.setInput('props', {
        url: createBoundProperty('https://example.com/audio.mp3'),
        description: createBoundProperty('Test Audio'),
      });
      fixture.detectChanges();
      const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
      expect(audio.src).toBeTruthy();
      const desc = fixture.nativeElement.querySelector('.a2ui-audio-description');
      expect(desc.textContent.trim()).toBe('Test Audio');
    });

    it('should not render description if not provided', () => {
      fixture.componentRef.setInput('props', {
        url: createBoundProperty('https://example.com/audio.mp3'),
      });
      fixture.detectChanges();
      const desc = fixture.nativeElement.querySelector('.a2ui-audio-description');
      expect(desc).toBeFalsy();
    });

    it('should handle missing props', () => {
      fixture.componentRef.setInput('props', {});
      fixture.detectChanges();
      const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
      expect(audio.getAttribute('src')).toBeFalsy();
    });
  });

  describe('CardComponent', () => {
    let component: CardComponent;
    let fixture: ComponentFixture<CardComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CardComponent],
        providers: [
          { provide: A2uiRendererService, useValue: mockRendererService },
          { provide: ComponentBinder, useValue: mockBinder },
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CardComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render component-host for child', () => {
      fixture.componentRef.setInput('props', {
        child: createBoundProperty('child-1'),
      });
      fixture.detectChanges();
      const host = fixture.debugElement.query(By.css('a2ui-v09-component-host'));
      expect(host).toBeTruthy();
      expect(host.componentInstance.componentId()).toBe('child-1');
    });
  });
});
