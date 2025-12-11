/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Surface } from '@a2ui/angular';
import * as v0_8 from '@a2ui/web-lib/0.8';

interface GallerySample {
  id: string;
  title: string;
  description: string;
  surface: v0_8.Types.Surface;
}

@Component({
  selector: 'app-gallery',
  imports: [CommonModule, Surface],
  template: `
    <div class="gallery-container">
      <div class="sidebar">
        <h2>Gallery Samples</h2>
        <div class="nav-list">
          <div
            *ngFor="let sample of samples"
            class="nav-item"
            [class.active]="activeSection === sample.id"
            (click)="scrollTo(sample.id)">
            {{ sample.title }}
          </div>
        </div>
      </div>

      <div class="main-content" (scroll)="onScroll($event)">
        <div class="component-list">
          <div
            *ngFor="let sample of samples"
            class="component-section"
            [id]="'section-' + sample.id">
            <div class="section-header">
              <div>
                <h3>{{ sample.title }}</h3>
                <p class="description">{{ sample.description }}</p>
              </div>
              <button class="json-toggle" (click)="toggleJson(sample.id)">
                {{ showJsonId === sample.id ? 'Hide JSON' : 'Show JSON' }}
              </button>
            </div>

            <div class="content-wrapper" [class.with-json]="showJsonId === sample.id">
              <div class="preview-card">
                <a2ui-surface [surfaceId]="'gallery-' + sample.id" [surface]="sample.surface"></a2ui-surface>
              </div>

              <div class="json-pane" *ngIf="showJsonId === sample.id">
                <pre>{{ getJson(sample.surface) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gallery-container { display: flex; height: calc(100vh - 64px); overflow: hidden; }
    .sidebar {
      width: 250px;
      background: #f5f5f5;
      border-right: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .sidebar h2 { padding: 20px; margin: 0; font-size: 18px; border-bottom: 1px solid #ddd; }
    .nav-list { padding: 10px 0; }
    .nav-item {
      padding: 10px 20px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
      border-left: 3px solid transparent;
    }
    .nav-item:hover { background: #e0e0e0; }
    .nav-item.active {
      background: #e8f0fe;
      color: #1a73e8;
      border-left-color: #1a73e8;
      font-weight: 500;
    }

    .main-content { flex: 1; overflow-y: auto; scroll-behavior: smooth; padding: 20px 40px; }
    .component-section { margin-bottom: 60px; scroll-margin-top: 20px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .component-section h3 { font-size: 24px; margin: 0 0 8px 0; }
    .description { color: #666; margin: 0; }

    .json-toggle {
      padding: 6px 12px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .json-toggle:hover { background: #e0e0e0; }

    .content-wrapper { display: flex; gap: 20px; height: 500px; }
    .content-wrapper.with-json .preview-card { flex: 1; }
    .preview-card {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 24px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      overflow-y: auto;
    }

    .json-pane {
      flex: 1;
      overflow-y: auto;
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
    }
    pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
  `]
})
export class GalleryComponent {
  activeSection = 'welcome';
  showJsonId: string | null = null;

  samples: GallerySample[] = [
    {
      id: 'welcome',
      title: 'Welcome Card',
      description: 'A simple welcome card with an image and text.',
      surface: this.createSingleComponentSurface('Card', {
        child: this.createComponent('Column', {
          children: [
            this.createComponent('Image', { url: { literalString: 'https://picsum.photos/id/10/300/200' } }),
            this.createComponent('Heading', { text: { literalString: 'Welcome to A2UI Gallery' } }),
            this.createComponent('Text', { text: { literalString: 'Explore the possibilities of A2UI components with this interactive gallery.' } }),
            this.createComponent('Button', { label: { literalString: 'Get Started' }, action: { type: 'click', payload: { action: 'start' } } })
          ],
          alignment: 'center'
        })
      })
    },
    {
      id: 'form',
      title: 'Contact Form',
      description: 'A sample contact form with validation.',
      surface: this.createSingleComponentSurface('Card', {
        child: this.createComponent('Column', {
          children: [
            this.createComponent('Heading', { text: { literalString: 'Contact Us' } }),
            this.createComponent('TextField', { label: { literalString: 'Full Name' }, text: { literalString: '' } }),
            this.createComponent('TextField', { label: { literalString: 'Email Address' }, type: 'email', text: { literalString: '' } }),
            this.createComponent('TextField', { label: { literalString: 'Message' }, text: { literalString: '' } }),
            this.createComponent('Button', { action: { type: 'submit' }, child: this.createComponent('Text', { text: { literalString: 'Send Message' } }) })
          ]
        })
      })
    }
  ];

  scrollTo(id: string) {
    this.activeSection = id;
    const element = document.getElementById('section-' + id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onScroll(event: Event) {
    const container = event.target as HTMLElement;
    const sections = container.querySelectorAll('.component-section');

    let current = '';
    const containerTop = container.scrollTop;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i] as HTMLElement;
      const sectionTop = section.offsetTop - container.offsetTop;

      if (sectionTop <= containerTop + 100) {
        const id = section.getAttribute('id');
        if (id) {
          current = id.replace('section-', '');
        }
      }
    }

    if (current && current !== this.activeSection) {
      this.activeSection = current;
    }
  }

  toggleJson(id: string) {
    this.showJsonId = this.showJsonId === id ? null : id;
  }

  getJson(surface: v0_8.Types.Surface): string {
    return JSON.stringify(surface, (key, value) => {
      if (key === 'rootComponentId' || key === 'dataModel' || key === 'styles') return undefined;
      if (value instanceof Map) return Object.fromEntries(value.entries());
      return value;
    }, 2);
  }

  private createSingleComponentSurface(type: string, properties: any): v0_8.Types.Surface {
    const rootId = 'root';
    return {
      rootComponentId: rootId,
      dataModel: new Map(),
      styles: {},
      componentTree: {
        id: rootId,
        type: type,
        properties: properties
      } as any,
      components: new Map()
    };
  }

  private createComponent(type: string, properties: any): any {
    return {
      id: 'generated-' + Math.random().toString(36).substr(2, 9),
      type: type,
      properties: properties
    };
  }

}
