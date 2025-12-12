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

interface ComponentSample {
  name: string;
  surface: v0_8.Types.Surface;
}

@Component({
  selector: 'app-library',
  imports: [CommonModule, Surface],
  template: `
    <div class="library-container">
      <div class="sidebar">
        <h2>Components</h2>
        <div class="nav-list">
          <div *ngFor="let category of categories">
            <div class="category-header">{{ category.name }}</div>
            <div 
              *ngFor="let sample of category.samples" 
              class="nav-item" 
              [class.active]="activeSection === sample.name"
              (click)="scrollTo(sample.name)">
              {{ sample.name }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="main-content" (scroll)="onScroll($event)">
        <div class="component-list">
          <div *ngFor="let category of categories">
            <div class="category-section">
              <h2>{{ category.name }}</h2>
              <div 
                *ngFor="let sample of category.samples" 
                class="component-section" 
                [id]="'section-' + sample.name">
                <div class="section-header">
                  <h3>{{ sample.name }}</h3>
                  <button class="json-toggle" (click)="toggleJson(sample.name)">
                    {{ showJsonId === sample.name ? 'Hide JSON' : 'Show JSON' }}
                  </button>
                </div>
                
                <div class="content-wrapper" [class.with-json]="showJsonId === sample.name">
                  <div class="preview-card">
                    <a2ui-surface [surfaceId]="'lib-' + sample.name" [surface]="sample.surface"></a2ui-surface>
                  </div>
                  
                  <div class="json-pane" *ngIf="showJsonId === sample.name">
                    <pre>{{ getJson(sample.surface) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .library-container { display: flex; height: calc(100vh - 64px); overflow: hidden; }
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
    .category-header {
      padding: 10px 20px 5px;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .nav-item { 
      padding: 8px 20px 8px 30px; 
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
    .category-section { margin-bottom: 40px; }
    .category-section h2 { font-size: 28px; margin-bottom: 30px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .component-section { margin-bottom: 60px; scroll-margin-top: 20px; }
    .section-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin-bottom: 20px; 
      padding-bottom: 10px; 
      border-bottom: 1px solid #eee; 
    }
    .component-section h3 { font-size: 24px; margin: 0; }
    
    .json-toggle {
      padding: 6px 12px;
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .json-toggle:hover { background: #e0e0e0; }
    
    .content-wrapper { display: flex; gap: 20px; }
    .content-wrapper.with-json .preview-card { flex: 1; }
    .preview-card { 
      flex: 1;
      border: 1px solid #ddd; 
      border-radius: 8px; 
      padding: 24px; 
      background: white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      overflow-x: auto;
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
      max-height: 500px;
    }
    pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
  `]
})
export class LibraryComponent {
  activeSection = '';
  showJsonId: string | null = null;

  scrollTo(name: string) {
    this.activeSection = name;
    const element = document.getElementById('section-' + name);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onScroll(event: Event) {
    const container = event.target as HTMLElement;
    const sections = container.querySelectorAll('.component-section');

    let current = '';
    const containerTop = container.scrollTop;

    // Find the section that is closest to the top of the container
    // We add a small offset (e.g. 100px) so it activates slightly before reaching the very top
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i] as HTMLElement;
      const sectionTop = section.offsetTop - container.offsetTop;

      if (sectionTop <= containerTop + 100) {
        // This section is above or near the top, so it's a candidate
        // Since we iterate in order, the last one matching this condition is the current one
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

  toggleJson(name: string) {
    this.showJsonId = this.showJsonId === name ? null : name;
  }

  getJson(surface: v0_8.Types.Surface): string {
    return JSON.stringify(surface, (key, value) => {
      if (key === 'rootComponentId' || key === 'dataModel' || key === 'styles') return undefined;
      if (value instanceof Map) return Object.fromEntries(value.entries());
      return value;
    }, 2);
  }

  categories = [
    {
      name: 'Layout',
      samples: [
        {
          name: 'Card',
          surface: this.createSingleComponentSurface('Card', {
            child: this.createComponent('Text', { text: { literalString: 'Content inside a card' } })
          })
        },
        {
          name: 'Column',
          surface: this.createSingleComponentSurface('Column', {
            children: [
              this.createComponent('Text', { text: { literalString: 'Item 1' } }),
              this.createComponent('Text', { text: { literalString: 'Item 2' } }),
              this.createComponent('Text', { text: { literalString: 'Item 3' } })
            ],
            alignment: 'center',
            distribution: 'space-around'
          })
        },
        {
          name: 'Divider',
          surface: this.createSingleComponentSurface('Column', {
            children: [
              this.createComponent('Text', { text: { literalString: 'Above Divider' } }),
              this.createComponent('Divider', {}),
              this.createComponent('Text', { text: { literalString: 'Below Divider' } })
            ]
          })
        },
        {
          name: 'List',
          surface: this.createSingleComponentSurface('List', {
            children: [
              this.createComponent('Text', { text: { literalString: 'List Item 1' } }),
              this.createComponent('Text', { text: { literalString: 'List Item 2' } }),
              this.createComponent('Text', { text: { literalString: 'List Item 3' } })
            ],
            direction: 'vertical'
          })
        },
        {
          name: 'Modal',
          surface: this.createSingleComponentSurface('Modal', {
            entryPointChild: this.createComponent('Button', { action: { type: 'none' }, child: this.createComponent('Text', { text: { literalString: 'Open Modal' } }) }),
            contentChild: this.createComponent('Card', {
              child: this.createComponent('Text', { text: { literalString: 'This is the modal content.' } })
            })
          })
        },
        {
          name: 'Row',
          surface: this.createSingleComponentSurface('Row', {
            children: [
              this.createComponent('Text', { text: { literalString: 'Left' } }),
              this.createComponent('Text', { text: { literalString: 'Center' } }),
              this.createComponent('Text', { text: { literalString: 'Right' } })
            ],
            alignment: 'center',
            distribution: 'space-between'
          })
        },
        {
          name: 'Tabs',
          surface: this.createSingleComponentSurface('Tabs', {
            tabItems: [
              { title: { literalString: 'Tab 1' }, child: this.createComponent('Text', { text: { literalString: 'Content for Tab 1' } }) },
              { title: { literalString: 'Tab 2' }, child: this.createComponent('Text', { text: { literalString: 'Content for Tab 2' } }) }
            ]
          })
        },
        {
          name: 'Text',
          surface: this.createSingleComponentSurface('Column', {
            children: [
              this.createComponent('Heading', { text: { literalString: 'Heading Text' } }),
              this.createComponent('Text', { text: { literalString: 'Standard body text.' } }),
              this.createComponent('Text', { text: { literalString: 'Caption text' }, usageHint: 'caption' })
            ]
          })
        }
      ]
    },
    {
      name: 'Media',
      samples: [
        {
          name: 'AudioPlayer',
          surface: this.createSingleComponentSurface('AudioPlayer', {
            url: { literalString: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
          })
        },
        {
          name: 'Icon',
          surface: this.createSingleComponentSurface('Row', {
            children: [
              this.createComponent('Icon', { name: { literalString: 'home' } }),
              this.createComponent('Icon', { name: { literalString: 'favorite' } }),
              this.createComponent('Icon', { name: { literalString: 'settings' } })
            ],
            distribution: 'space-around'
          })
        },
        {
          name: 'Image',
          surface: this.createSingleComponentSurface('Image', {
            url: { literalString: 'https://picsum.photos/id/10/300/200' },
          })
        },
        {
          name: 'Video',
          surface: this.createSingleComponentSurface('Video', {
            url: { literalString: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }
          })
        }
      ]
    },
    {
      name: 'Inputs',
      samples: [
        {
          name: 'Button',
          surface: this.createSingleComponentSurface('Row', {
            children: [
              this.createComponent('Button', { label: { literalString: 'Primary' }, action: { type: 'click' }, child: this.createComponent('Text', { text: { literalString: 'Primary' } }) }),
              this.createComponent('Button', { label: { literalString: 'Secondary' }, action: { type: 'click' }, child: this.createComponent('Text', { text: { literalString: 'Secondary' } }) })
            ],
            distribution: 'space-around'
          })
        },
        {
          name: 'CheckBox',
          surface: this.createSingleComponentSurface('Column', {
            children: [
              this.createComponent('CheckBox', { label: { literalString: 'Unchecked' }, value: { literalBoolean: false } }),
              this.createComponent('CheckBox', { label: { literalString: 'Checked' }, value: { literalBoolean: true } })
            ]
          })
        },
        {
          name: 'DateTimeInput',
          surface: this.createSingleComponentSurface('Column', {
            children: [
              this.createComponent('DateTimeInput', { enableDate: true, enableTime: false, value: { literalString: '2025-12-09' } }),
              this.createComponent('DateTimeInput', { enableDate: true, enableTime: true, value: { literalString: '2025-12-09T12:00:00' } })
            ]
          })
        },
        {
          name: 'MultipleChoice',
          surface: this.createSingleComponentSurface('MultipleChoice', {
            options: [
              { value: 'opt1', label: { literalString: 'Option 1' } },
              { value: 'opt2', label: { literalString: 'Option 2' } },
              { value: 'opt3', label: { literalString: 'Option 3' } }
            ],
            selections: { literalString: 'opt1' }
          })
        },
        {
          name: 'Slider',
          surface: this.createSingleComponentSurface('Slider', {
            value: { literalNumber: 50 },
            minValue: 0,
            maxValue: 100
          })
        },
        {
          name: 'TextField',
          surface: this.createSingleComponentSurface('Column', {
            children: [
              this.createComponent('TextField', {
                label: { literalString: 'Standard Input' },
                text: { literalString: 'Some text' }
              }),
              this.createComponent('TextField', {
                label: { literalString: 'Password' },
                type: 'password',
                text: { literalString: '' }
              })
            ]
          })
        }
      ]
    }
  ];

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
      id: 'generated-' + Math.random().toString(36).substr(2, 9), // ID will be overridden by key in map usually, or ignored if inline
      type: type,
      properties: properties
    };
  }
}
