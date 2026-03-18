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

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  Type,
  inject,
  input,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ComponentContext } from '@a2ui/web_core/v0_9';
import { A2uiRendererService } from './a2ui-renderer.service';
import { AngularCatalog } from '../catalog/types';
import { ComponentBinder } from './component-binder.service';

/**
 * Host component for any A2UI component.
 * Manages the lifecycle of a ComponentContext and ComponentBinding.
 */
@Component({
  selector: 'a2ui-v09-component-host',
  imports: [NgComponentOutlet],
  template: `
    @if (componentType) {
      <ng-container
        *ngComponentOutlet="
          componentType;
          inputs: { props: props, surfaceId: surfaceId(), dataContextPath: dataContextPath() }
        "
      ></ng-container>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentHostComponent implements OnInit {
  componentId = input.required<string>();
  surfaceId = input.required<string>();
  dataContextPath = input<string>('/');

  private rendererService = inject(A2uiRendererService);
  private binder = inject(ComponentBinder);
  private destroyRef = inject(DestroyRef);

  protected componentType: Type<any> | null = null;
  protected props: any = {};
  private context?: ComponentContext;

  ngOnInit(): void {
    const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId());

    if (!surface) {
      console.warn(`Surface ${this.surfaceId()} not found`);
      return;
    }

    const componentModel = surface.componentsModel.get(this.componentId());

    if (!componentModel) {
      console.warn(`Component ${this.componentId()} not found in surface ${this.surfaceId()}`);
      return;
    }

    // Resolve component from the surface's catalog
    const catalog = surface.catalog as AngularCatalog;
    const api = catalog.components.get(componentModel.type);

    if (!api) {
      console.error(`Component type "${componentModel.type}" not found in catalog "${catalog.id}"`);
      return;
    }
    this.componentType = api.component;

    // Create context
    this.context = new ComponentContext(surface, this.componentId(), this.dataContextPath());
    this.props = this.binder.bind(this.context);

    this.destroyRef.onDestroy(() => {
      // ComponentContext itself doesn't have a dispose, but its inner components might.
      // However, SurfaceModel takes care of component disposal.
    });
  }
}
