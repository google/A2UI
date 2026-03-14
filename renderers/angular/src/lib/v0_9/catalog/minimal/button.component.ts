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

import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentHostComponent } from '../../core/component-host.component';
import { ComponentContext, DataContext } from '@a2ui/web_core/v0_9';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';

/**
 * Angular implementation of the A2UI Button component (v0.9).
 */
@Component({
  selector: 'a2ui-v09-button',
  standalone: true,
  imports: [CommonModule, ComponentHostComponent],
  template: `
    <button
      [type]="props.variant?.value() === 'primary' ? 'submit' : 'button'"
      [class]="'a2ui-button ' + (props.variant?.value() || 'default')"
      (click)="handleClick()"
    >
      <a2ui-v09-component-host
        *ngIf="props.child?.value()"
        [componentId]="props.child.value()"
        [surfaceId]="surfaceId"
        [dataContextPath]="dataContextPath"
      >
      </a2ui-v09-component-host>
    </button>
  `,
  styles: [
    `
      .a2ui-button {
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid #ccc;
        cursor: pointer;
      }
      .a2ui-button.primary {
        background-color: #007bff;
        color: white;
        border-color: #0069d9;
      }
      .a2ui-button.borderless {
        background: none;
        border: none;
        padding: 0;
        color: #007bff;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  /**
   * Bound properties.
   */
  @Input() props: any = {};
  @Input() surfaceId!: string;
  @Input() dataContextPath: string = '/';

  private rendererService = inject(A2uiRendererService);

  handleClick() {
    const action = this.props.action?.value();
    if (action) {
      const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId);
      if (surface) {
        const dataContext = new DataContext(
          surface.dataModel,
          this.dataContextPath,
          surface.catalog.invoker,
        );
        const resolvedAction = dataContext.resolveAction(action);
        surface.dispatchAction(resolvedAction);
      }
    }
  }
}
