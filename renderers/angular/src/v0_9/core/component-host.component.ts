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
 * Dynamically renders an A2UI component as defined in the current surface model.
 *
 * This component acts as a bridge between the A2UI surface model and Angular components.
 * It resolves the appropriate component from the catalog based on the component's type,
 * and uses {@link ComponentBinder} to create reactive property bindings.
 *
 * Usually, you'll use the higher-level {@link SurfaceComponent} which automatically
 * sets up a host for the 'root' component.
 */
@Component({
  selector: 'a2ui-v09-component-host',
  imports: [NgComponentOutlet],
  template: `
    @if (componentType) {
      <ng-container
        *ngComponentOutlet="
          componentType;
          inputs: {
          props: props,
          surfaceId: surfaceId(),
          componentId: componentId(),
          dataContextPath: dataContextPath(),
        }
        "
      ></ng-container>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentHostComponent implements OnInit {
  /** The ID of the component to render. Defaults to 'root'. */
  componentId = input<string>('root');

  /** The unique identifier of the surface this component belongs to. */
  surfaceId = input.required<string>();

  /**
   * The path within the surface's data model that represents the current data state.
   * Defaults to '/'.
   */
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
