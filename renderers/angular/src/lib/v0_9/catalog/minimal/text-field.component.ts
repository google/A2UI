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
import { A2uiRendererService } from '../../core/a2ui-renderer.service';

/**
 * Angular implementation of the A2UI TextField component (v0.9).
 */
@Component({
  selector: 'a2ui-v09-text-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="a2ui-text-field-container">
      <label *ngIf="props.label?.value()">{{ props.label?.value() }}</label>
      <input
        [type]="getInputType()"
        [value]="props.value?.value() || ''"
        (input)="handleInput($event)"
        [placeholder]="props.placeholder?.value() || ''"
      />
      <!-- Validation errors would go here in a more advanced version -->
    </div>
  `,
  styles: [
    `
      .a2ui-text-field-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 100%;
      }
      input {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  /**
   * Bound properties.
   */
  @Input() props: any = {};
  @Input() surfaceId?: string;
  @Input() componentId?: string;
  @Input() dataContextPath?: string;

  private rendererService = inject(A2uiRendererService);

  getInputType(): string {
    const variant = this.props.variant?.value();
    switch (variant) {
      case 'obscured':
        return 'password';
      case 'number':
        return 'number';
      default:
        return 'text';
    }
  }

  handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Update the data path.  If anything is listening to this path, it will be
    // notified.
    this.props.value?.onUpdate(value);
  }
}
