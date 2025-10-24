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

import {
  Binding,
  ComponentRef,
  Directive,
  effect,
  inject,
  input,
  inputBinding,
  OnDestroy,
  Type,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { Catalog } from './types';

@Directive({
  selector: 'ng-container[a2ui-renderer]',
})
export class Renderer implements OnDestroy {
  private viewContainerRef = inject(ViewContainerRef);
  private catalog = inject(Catalog);
  private currentRef: ComponentRef<unknown> | null = null;
  private isDestroyed = false;

  readonly surfaceId = input.required<v0_8.Types.SurfaceID>();
  readonly component = input.required<v0_8.Types.AnyComponentNode>();

  constructor() {
    effect(() => {
      const surfaceId = this.surfaceId();
      const component = this.component();
      untracked(() => this.render(surfaceId, component));
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.clear();
  }

  private async render(surfaceId: v0_8.Types.SurfaceID, component: v0_8.Types.AnyComponentNode) {
    const config = this.catalog[component.type];
    let newComponent: Type<unknown> | null = null;
    let componentBindings: Binding[] | null = null;

    if (typeof config === 'function') {
      newComponent = await config();
    } else if (typeof config === 'object') {
      newComponent = await config.type();
      componentBindings = config.bindings(component as any);
    }

    this.clear();

    if (newComponent && !this.isDestroyed) {
      const bindings = [
        inputBinding('surfaceId', () => surfaceId),
        inputBinding('component', () => component),
      ];

      if (componentBindings) {
        bindings.push(...componentBindings);
      }

      this.currentRef = this.viewContainerRef.createComponent(newComponent, {
        bindings,
        injector: this.viewContainerRef.injector,
      });
    }
  }

  private clear() {
    this.currentRef?.destroy();
    this.currentRef = null;
  }
}
