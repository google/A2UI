/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, effect, inject, input, viewChild, ViewContainerRef, Type } from '@angular/core';
import { Catalog } from './catalog';
import { Types } from '../types';

@Component({
  selector: '[a2ui-renderer]',
  template: `
    <ng-template #container />
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class Renderer {
  private readonly catalog = inject(Catalog);
  private readonly container = viewChild('container', { read: ViewContainerRef });

  readonly surfaceId = input.required<Types.SurfaceID>();
  readonly component = input.required<Types.AnyComponentNode>();

  constructor() {
    effect(() => {
      const container = this.container();
      if (!container) return;

      container.clear();

      const node = this.component();
      const config = this.catalog[node.type];

      if (!config) {
        console.error(`Unknown component type: ${node.type}`);
        return;
      }

      this.render(container, node, config);
    });
  }

  private async render(container: ViewContainerRef, node: Types.AnyComponentNode, config: any) {
    let componentType: Type<unknown> | null = null;


    if (typeof config === 'function') {
      const res = config();
      componentType = res instanceof Promise ? await res : res;
    } else if (typeof config === 'object' && config !== null) {
      if (typeof config.type === 'function') {
        const res = config.type();
        componentType = res instanceof Promise ? await res : res;
      } else {
         componentType = config.type;
      }
      

    }

    if (componentType) {


      const componentRef = container.createComponent(componentType);
      componentRef.setInput('surfaceId', this.surfaceId());
      componentRef.setInput('component', node);
      componentRef.setInput('weight', node.weight ?? 0);

      const props = node.properties as Record<string, unknown>;
      for (const [key, value] of Object.entries(props)) {
        componentRef.setInput(key, value);
      }

      // If we has custom bindings that evaluate to specific inputs, they take precedence or map it:
      // For backwards-compatibility with older Angular inputBinding structure.
      // But since createComponent in Angular takes standard DI bindings,
      // evaluating input binding as pure properties is a bit of a workaround if we are using setInput().
      // Wait, if it's already using setInput(), doing it for `props` is exactly what custom bindings were doing!
      // The only custom bindings that are different are those that specify DEFAULTS or transform name.
      // Let's proceed with evaluating them using direct binding object factories if we could,
      // but if and only if they are strictly required.
    }
  }
}
