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
  Binding,
  ComponentRef,
  Directive,
  DOCUMENT,
  inject,
  Input,
  inputBinding,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  Type,
  ViewContainerRef,
} from '@angular/core';
import * as Styles from '@a2ui/web_core/styles/index';
import * as Types from '@a2ui/web_core/types/types';
import { Catalog } from './catalog';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[a2ui-renderer]',
  standalone: true,
})
export class Renderer implements OnChanges, OnDestroy {
  private viewContainerRef = inject(ViewContainerRef);
  private catalog = inject(Catalog);
  private static hasInsertedStyles = false;

  private currentRef: ComponentRef<unknown> | null = null;
  private isDestroyed = false;

  @Input({ required: true }) surfaceId!: Types.SurfaceID;
  @Input({ required: true }) component!: Types.AnyComponentNode;

  constructor() {
    const platformId = inject(PLATFORM_ID);
    const document = inject(DOCUMENT);

    if (!Renderer.hasInsertedStyles && isPlatformBrowser(platformId)) {
      const styles = document.createElement('style');
      styles.textContent = Styles.structuralStyles;
      document.head.appendChild(styles);
      Renderer.hasInsertedStyles = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['surfaceId'] || changes['component']) {
      this.render(this.surfaceId, this.component);
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clear();
  }

  private async render(surfaceId: Types.SurfaceID, component: Types.AnyComponentNode) {
    try {
      const config = this.catalog[component.type];
      let newComponent: Type<unknown> | null = null;
      let componentBindings: Binding[] | null = null;

      if (typeof config === 'function') {
        newComponent = await config();
      } else if (typeof config === 'object') {
        newComponent = await config.type();
        componentBindings = config.bindings(component);
      }

      this.clear();

      if (newComponent && !this.isDestroyed) {
        const bindings = [
          inputBinding('surfaceId', () => surfaceId),
          inputBinding('component', () => component),
          inputBinding('weight', () => component.weight ?? 'initial'),
        ];

        if (componentBindings) {
          bindings.push(...componentBindings);
        }

        this.currentRef = this.viewContainerRef.createComponent(newComponent, {
          bindings,
          injector: this.viewContainerRef.injector,
        });
      }
    } catch (e) {
      console.error('Renderer.render error:', e);
    }
  }

  private clear() {
    this.currentRef?.destroy();
    this.currentRef = null;
  }
}
