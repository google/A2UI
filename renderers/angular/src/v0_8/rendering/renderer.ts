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

import {
  Directive,
  effect,
  inject,
  input,
  ViewContainerRef,
  Type,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { structuralStyles } from '@a2ui/web_core/styles/index';
import { Catalog } from './catalog';
import { Types } from '../types';

@Directive({
  selector: '[a2ui-renderer]',
  standalone: true,
})
export class Renderer {
  private static hasInsertedStyles = false;

  private readonly catalog = inject(Catalog);
  private readonly container = inject(ViewContainerRef);

  readonly surfaceId = input.required<Types.SurfaceID>();
  readonly component = input.required<Types.AnyComponentNode>();

  constructor() {
    const platformId = inject(PLATFORM_ID);
    const document = inject(DOCUMENT);

    if (!Renderer.hasInsertedStyles && isPlatformBrowser(platformId)) {
      const styleElement = document.createElement('style');
      styleElement.textContent = structuralStyles;
      document.head.appendChild(styleElement);
      Renderer.hasInsertedStyles = true;
    }

    effect(() => {
      const container = this.container;
      container.clear();

      let node = this.component();
      // Handle v0.8 wrapped component format
      if (!node.type && (node as any).component) {
        const wrapped = (node as any).component;
        const type = Object.keys(wrapped)[0];
        if (type) {
          node = {
            ...node,
            type: type as any,
            properties: wrapped[type],
          };
        }
      }

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
        try {
          componentRef.setInput(key, value);
        } catch (e) {
          console.warn(
            `[Renderer] Property "${key}" could not be set on component ${node.type}. If this property is required by the specification, ensure the component declares it as an input.`,
          );
        }
      }
    }
  }
}
