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
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { ComponentHostComponent } from '../../core/component-host.component';
import { DataContext } from '@a2ui/web_core/v0_9';
import { A2uiRendererService } from '../../core/a2ui-renderer.service';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI Button component (v0.9).
 *
 * Renders a clickable button with a single child component (usually Text).
 * Dispatches an action when clicked if an `action` property is provided.
 */
@Component({
  selector: 'a2ui-v09-button',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    <button
      [type]="variant() === 'primary' ? 'submit' : 'button'"
      [class]="'a2ui-button ' + variant()"
      (click)="handleClick()"
      [disabled]="props()['isValid']?.value() === false"
    >
      @if (child()) {
        <a2ui-v09-component-host
          [componentKey]="child()!"
          [surfaceId]="surfaceId()"
        >
        </a2ui-v09-component-host>
      }
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
      .a2ui-button:disabled {
        background-color: #e9ecef;
        color: #6c757d;
        border-color: #ced4da;
        cursor: not-allowed;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `child`: The ID of the component to render inside the button.
   * - `variant`: Button style variant ('default', 'primary', 'borderless').
   * - `action`: The A2UI action to dispatch on click.
   * - `checks`: Optional validation rules.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input.required<string>();
  dataContextPath = input<string>('/');

  private rendererService = inject(A2uiRendererService);

  variant = computed(() => this.props()['variant']?.value() ?? 'default');
  child = computed(() => this.props()['child']?.value());
  action = computed(() => this.props()['action']?.value());



  handleClick() {
    const action = this.action();
    if (action) {
      const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId());
      if (surface) {
        const dataContext = new DataContext(surface, this.dataContextPath());
        const resolvedAction = dataContext.resolveAction(action);
        surface.dispatchAction(resolvedAction, this.componentId());
      }
    }
  }
}
