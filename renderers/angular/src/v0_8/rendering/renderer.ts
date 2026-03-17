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

import { Component, effect, inject, input, viewChild, ViewContainerRef } from '@angular/core';
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
  readonly component = input.required<Types.AnyComponentNode | string>();

  constructor() {
    effect(() => {
      const container = this.container();
      if (!container) return;

      container.clear();

      const nodeOrId = this.component();
      let node: Types.AnyComponentNode;
      if (typeof nodeOrId === 'string') {
        const catalogNode = this.catalog.getComponent(nodeOrId);
        if (!catalogNode) {
          console.error(`Component not found: ${nodeOrId}`);
          return;
        }
        node = catalogNode;
      } else {
        node = nodeOrId;
      }

      const componentType = this.catalog.getComponentConfig(node.type);
      if (!componentType) {
        console.error(`Unknown component type: ${node.type}`);
        return;
      }

      const componentRef = container.createComponent(componentType);
      componentRef.setInput('surfaceId', this.surfaceId());
      componentRef.setInput('component', node);
      componentRef.setInput('weight', node.weight ?? 0);

      const props = node.properties as Record<string, unknown>;
      for (const [key, value] of Object.entries(props)) {
        componentRef.setInput(key, value);
      }
    });
  }
}
