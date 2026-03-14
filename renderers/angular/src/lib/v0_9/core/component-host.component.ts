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
  Input,
  OnInit,
  Type,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="componentType">
      <ng-container
        *ngComponentOutlet="
          componentType;
          inputs: { props: props, surfaceId: surfaceId, dataContextPath: dataContextPath }
        "
      ></ng-container>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentHostComponent implements OnInit {
  @Input({ required: true }) componentId!: string;
  @Input({ required: true }) surfaceId!: string;
  @Input() dataContextPath: string = '/';

  private rendererService = inject(A2uiRendererService);
  private catalog = inject(AngularCatalog);
  private binder = inject(ComponentBinder);
  private destroyRef = inject(DestroyRef);

  protected componentType: Type<any> | null = null;
  protected props: any = {};
  private context?: ComponentContext;

  ngOnInit(): void {


    const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId);

    if (!surface) {
      console.warn(`Surface ${this.surfaceId} not found`);
      return;
    }

    const componentModel = surface.componentsModel.get(this.componentId);

    if (!componentModel) {
      console.warn(`Component ${this.componentId} not found in surface ${this.surfaceId}`);
      return;
    }

    // Resolve component from catalog
    const api = this.catalog.components.get(componentModel.type);

    if (!api) {
      console.error(`Component type "${componentModel.type}" not found in catalog`);
      return;
    }
    this.componentType = api.component;

    // Create context
    this.context = new ComponentContext(surface, this.componentId, this.dataContextPath);
    this.props = this.binder.bind(this.context);

    this.destroyRef.onDestroy(() => {
      // ComponentContext itself doesn't have a dispose, but its inner components might.
      // However, SurfaceModel takes care of component disposal.
    });
  }
}
