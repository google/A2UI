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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component, input} from '@angular/core';
import {By} from '@angular/platform-browser';
import {DividerComponent} from './divider.component';
import {ImageComponent} from './image.component';
import {IconComponent} from './icon.component';
import {VideoComponent} from './video.component';
import {AudioPlayerComponent} from './audio-player.component';
import {ComponentModel} from '@a2ui/web_core/v0_9';
import {CardComponent} from './card.component';
import {A2uiRendererService} from '../../core/a2ui-renderer.service';
import {ComponentBinder} from '../../core/component-binder.service';
import {setComponentProps, createBoundProperty, ComponentToProps} from '../../core/test-utils';

describe('Simple Components', () => {
  let mockRendererService: any;
  let mockBinder: any;

  beforeEach(() => {
    mockRendererService = {
      surfaceGroup: {
        getSurface: jasmine.createSpy('getSurface').and.returnValue({
          componentsModel: new Map([
            ['child-1', new ComponentModel('child-1', 'Text', {text: {value: 'Child 1'}})],
            ['child-2', new ComponentModel('child-2', 'Text', {text: {value: 'Child 2'}})],
            ['content-1', new ComponentModel('content-1', 'Text', {text: {value: 'Content 1'}})],
            ['content-2', new ComponentModel('content-2', 'Text', {text: {value: 'Content 2'}})],
            ['trigger-btn', new ComponentModel('trigger-btn', 'Text', {text: {value: 'Open'}})],
            [
              'modal-content',
              new ComponentModel('modal-content', 'Text', {text: {value: 'Modal'}}),
            ],
          ]),
          catalog: {
            id: 'mock-catalog',
            components: new Map([['Text', {type: 'Text', component: DummyTextComponent}]]),
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

  describe('DividerComponent', () => {
    let component: DividerComponent;
    let fixture: ComponentFixture<DividerComponent>;
    let defaultProps: ComponentToProps<DividerComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DividerComponent],
        providers: [
          {provide: A2uiRendererService, useValue: mockRendererService},
          {provide: ComponentBinder, useValue: mockBinder},
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(DividerComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');

      defaultProps = {
        axis: createBoundProperty('horizontal' as const),
      };
      setComponentProps(fixture, defaultProps);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render horizontal divider by default', () => {
      fixture.detectChanges();
      const divider = fixture.nativeElement.querySelector('.a2ui-divider');
      expect(divider.classList).toContain('horizontal');
    });

    it('should render vertical divider', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        axis: createBoundProperty('vertical' as const),
      });
      fixture.detectChanges();
      const divider = fixture.nativeElement.querySelector('.a2ui-divider');
      expect(divider.classList).toContain('vertical');
    });
  });

  describe('ImageComponent', () => {
    let component: ImageComponent;
    let fixture: ComponentFixture<ImageComponent>;
    let defaultProps: ComponentToProps<ImageComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ImageComponent],
        providers: [
          {provide: A2uiRendererService, useValue: mockRendererService},
          {provide: ComponentBinder, useValue: mockBinder},
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(ImageComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');

      defaultProps = {
        url: createBoundProperty('https://example.com/image.png'),
        fit: createBoundProperty('cover' as const),
        variant: createBoundProperty('avatar' as const),
      };
      setComponentProps(fixture, defaultProps);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render image with url', () => {
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.src).toBeTruthy();
      expect(img.style.objectFit).toBe('cover');
      expect(img.className).toContain('avatar');
    });

    it('should render image with description', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        description: createBoundProperty('A cute cat'),
      });
      fixture.detectChanges();
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('A cute cat');
    });

    it('should support all specified variants', () => {
      const variants = [
        'icon',
        'avatar',
        'smallFeature',
        'mediumFeature',
        'largeFeature',
        'header',
      ] as const;
      for (const variant of variants) {
        setComponentProps(fixture, {
          ...defaultProps,
          variant: createBoundProperty(variant),
        });
        fixture.detectChanges();
        const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
        expect(img.className).toContain(variant);
      }
    });
  });

  describe('IconComponent', () => {
    let component: IconComponent;
    let fixture: ComponentFixture<IconComponent>;
    let defaultProps: ComponentToProps<IconComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [IconComponent],
        providers: [
          {provide: A2uiRendererService, useValue: mockRendererService},
          {provide: ComponentBinder, useValue: mockBinder},
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(IconComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');

      defaultProps = {
        name: createBoundProperty('search' as const),
      };
      setComponentProps(fixture, defaultProps);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render named icon', () => {
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('search');
    });

    it('should convert camelCase icon names to snake_case', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        name: createBoundProperty('shoppingCart' as const),
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('shopping_cart');
    });

    it('should map "play" to "play_arrow"', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        name: createBoundProperty('play' as const),
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('play_arrow');
    });

    it('should map "rewind" to "fast_rewind"', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        name: createBoundProperty('rewind' as const),
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('fast_rewind');
    });

    it('should map "favoriteOff" to "favorite_border"', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        name: createBoundProperty('favoriteOff' as const),
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('favorite_border');
    });

    it('should map "starOff" to "star_border"', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        name: createBoundProperty('starOff' as const),
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.a2ui-icon');
      expect(icon.textContent.trim()).toBe('star_border');
    });

    it('should render path icon', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        name: createBoundProperty({
          path: 'M10 10...',
        }) as unknown as ComponentToProps<IconComponent>['name'],
      });
      fixture.detectChanges();
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    });
  });

  describe('VideoComponent', () => {
    let component: VideoComponent;
    let fixture: ComponentFixture<VideoComponent>;
    let defaultProps: ComponentToProps<VideoComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [VideoComponent],
        providers: [
          {provide: A2uiRendererService, useValue: mockRendererService},
          {provide: ComponentBinder, useValue: mockBinder},
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(VideoComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');

      defaultProps = {
        url: createBoundProperty('https://example.com/video.mp4'),
      };
      setComponentProps(fixture, defaultProps);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render video with url', () => {
      fixture.detectChanges();
      const video = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
      expect(video.src).toBeTruthy();
    });

    it('should handle missing props', () => {
      setComponentProps(fixture, {} as ComponentToProps<VideoComponent>);
      fixture.detectChanges();
      const video = fixture.nativeElement.querySelector('video') as HTMLVideoElement;
      expect(video.getAttribute('src')).toBeFalsy();
    });
  });

  describe('AudioPlayerComponent', () => {
    let component: AudioPlayerComponent;
    let fixture: ComponentFixture<AudioPlayerComponent>;
    let defaultProps: ComponentToProps<AudioPlayerComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AudioPlayerComponent],
        providers: [
          {provide: A2uiRendererService, useValue: mockRendererService},
          {provide: ComponentBinder, useValue: mockBinder},
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(AudioPlayerComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');

      defaultProps = {
        url: createBoundProperty('https://example.com/audio.mp3'),
        description: createBoundProperty('Test Audio'),
      };
      setComponentProps(fixture, defaultProps);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render audio with url', () => {
      fixture.detectChanges();
      const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
      expect(audio.src).toBeTruthy();
      const desc = fixture.nativeElement.querySelector('.a2ui-audio-description');
      expect(desc.textContent.trim()).toBe('Test Audio');
    });

    it('should not render description if not provided', () => {
      setComponentProps(fixture, {
        ...defaultProps,
        description: createBoundProperty(undefined),
      });
      fixture.detectChanges();
      const desc = fixture.nativeElement.querySelector('.a2ui-audio-description');
      expect(desc).toBeFalsy();
    });

    it('should handle missing props', () => {
      setComponentProps(fixture, {} as ComponentToProps<AudioPlayerComponent>);
      fixture.detectChanges();
      const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
      expect(audio.getAttribute('src')).toBeFalsy();
    });
  });

  describe('CardComponent', () => {
    let component: CardComponent;
    let fixture: ComponentFixture<CardComponent>;
    let defaultProps: ComponentToProps<CardComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CardComponent],
        providers: [
          {provide: A2uiRendererService, useValue: mockRendererService},
          {provide: ComponentBinder, useValue: mockBinder},
        ],
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(CardComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('surfaceId', 'test-surface');
      fixture.componentRef.setInput('dataContextPath', '/');

      defaultProps = {
        child: createBoundProperty({id: 'child-1', basePath: '/'}),
      };
      setComponentProps(fixture, defaultProps);
    });

    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render component-host for child', () => {
      fixture.detectChanges();
      const host = fixture.debugElement.query(By.css('a2ui-v09-component-host'));
      expect(host).toBeTruthy();
      expect(host.componentInstance.componentKey()).toEqual({id: 'child-1', basePath: '/'});
    });
  });
});
