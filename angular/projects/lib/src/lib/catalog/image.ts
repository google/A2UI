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

import { Component, computed, ElementRef, inject, input } from '@angular/core';
import { DynamicComponent } from '../rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-image',
  styles: `
    :host {
      display: block;
      flex: var(--weight);
      min-height: 0;
      overflow: auto;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
  `,
  template: `
    @let resolvedUrl = this.resolvedUrl();

    @if (resolvedUrl) {
      <section [class]="classes()" [style]="theme.additionalStyles?.Image">
        <img [src]="resolvedUrl" />
      </section>
    }
  `,
})
export class Image extends DynamicComponent {
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly url = input.required<v0_8.Primitives.StringValue | null>();
  protected readonly resolvedUrl = computed(() => this.resolvePrimitive(this.url()));

  protected readonly classes = computed(() => {
    const classes: Record<string, boolean> = {};
    const parentElement = this.elementRef.nativeElement.parentElement;

    for (const [id, value] of Object.entries(this.theme.components.Image)) {
      if (typeof value === 'boolean') {
        classes[id] = value;
        continue;
      }

      let tagName = value;

      if (tagName.endsWith('>')) {
        tagName = tagName.replace(/\W*>$/, '').trim();

        if (parentElement && parentElement.tagName.toLocaleLowerCase() === tagName) {
          classes[id] = true;
        }
      } else {
        let parent = parentElement;
        while (parent) {
          if (tagName === parent.tagName.toLocaleLowerCase()) {
            classes[id] = true;
            break;
          }
          parent = parent.parentElement;
        }
      }
    }

    return classes;
  });
}
