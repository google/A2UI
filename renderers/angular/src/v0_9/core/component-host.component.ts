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
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostBinding,
  OnInit,
  Type,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ComponentContext, ComponentModel, SurfaceModel } from '@a2ui/web_core/v0_9';
import { A2uiRendererService } from './a2ui-renderer.service';
import { AngularCatalog } from '../catalog/types';
import { ComponentBinder } from './component-binder.service';
import {BoundProperty} from './types';

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
  host: {
    'style': 'display: contents;'
  },
  template: `
    @if (componentType) {
      <ng-container
        *ngComponentOutlet="
          componentType;
          inputs: {
            props: props,
            surfaceId: surfaceId(),
            componentId: resolvedComponentId,
            dataContextPath: resolvedDataContextPath,
          }
        "
      ></ng-container>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentHostComponent implements OnInit {
  /** The key of the component to render, either an ID string or an object with ID and basePath. Defaults to 'root'. */
  componentKey = input<string | { id: string; basePath: string }>('root');

  /** The unique identifier of the surface this component belongs to. */
  surfaceId = input.required<string>();

  private readonly rendererService = inject(A2uiRendererService);
  private readonly binder = inject(ComponentBinder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected componentType: Type<any> | null = null;
  protected props: Record<string, BoundProperty> = {};
  private context?: ComponentContext;
  protected weight = signal<string | number | null>(null);

  // TODO(#1199): Move weight handling to the catalog specification.
  @HostBinding('style.flex')
  get flexStyle() {
    const w = this.weight();
    return w ? `${w}` : '';
  }
  protected resolvedComponentId: string = '';
  protected resolvedDataContextPath: string = '/';

  ngOnInit(): void {
    const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId());

    if (!surface) {
      console.warn(`Surface ${this.surfaceId()} not found`);
      return;
    }

    const key = this.componentKey();
    let id: string;
    let basePath: string;

    if (typeof key === 'object' && key !== null && 'id' in key) {
      id = key.id;
      basePath = key.basePath || '/';
    } else {
      id = key;
      basePath = '/';
    }

    this.resolvedComponentId = id;

    const componentModel = surface.componentsModel.get(id);

    if (!componentModel) {
      console.warn(`Component ${id} not found in surface ${this.surfaceId()}. Waiting for it...`);

      const sub = surface.componentsModel.onCreated.subscribe((comp) => {
        if (comp.id === id) {
          this.initializeComponent(surface, comp, id, basePath);
          this.cdr.markForCheck();
          sub.unsubscribe();
        }
      });

      this.destroyRef.onDestroy(() => sub.unsubscribe());
      return;
    }

    this.initializeComponent(surface, componentModel, id, basePath);
  }

  private initializeComponent(
    surface: SurfaceModel<any>,
    componentModel: ComponentModel,
    id: string,
    basePath: string,
  ): void {
    // Resolve component from the surface's catalog
    const catalog = surface.catalog as AngularCatalog;
    const api = catalog.components.get(componentModel.type);

    if (!api) {
      console.error(`Component type "${componentModel.type}" not found in catalog "${catalog.id}"`);
      return;
    }
    this.componentType = api.component;

    // Create context
    this.context = new ComponentContext(surface, id, basePath);
    this.props = this.binder.bind(this.context);
    this.resolvedDataContextPath = this.context.dataContext.path;

    // Subscribes to updates to the component model properties, to get the
    // component to react when a new prop is added after creation.
    const onPropsUpdateSub = componentModel.onUpdated.subscribe(() => {
      this.props = this.binder.bind(this.context!);
      // TODO(#1199): Move weight handling to the catalog specification.
      this.weight.set(componentModel.properties['weight'] || null);
      this.cdr.markForCheck();
    });

    this.weight.set(componentModel.properties['weight'] || null);

    this.destroyRef.onDestroy(() => {
      // ComponentContext itself doesn't have a dispose, but its inner components might.
      // However, SurfaceModel takes care of component disposal.
      onPropsUpdateSub.unsubscribe();
    });

    this.cdr.markForCheck();
  }
}
