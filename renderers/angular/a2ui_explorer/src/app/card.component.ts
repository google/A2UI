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

import {Component, Input, ChangeDetectionStrategy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentHostComponent} from '@a2ui/angular/v0_9';
import {BoundProperty} from '@a2ui/angular/v0_9';

/**
 * A simple card component for the demo.
 */
@Component({
  selector: 'demo-card',
  standalone: true,
  imports: [CommonModule, ComponentHostComponent],
  template: `
    <div
      class="demo-card"
      style="border: 1px solid #ccc; padding: 16px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 16px; background-color: white;"
    >
      <a2ui-v09-component-host
        *ngIf="props['child']?.value()"
        [componentKey]="props['child'].value()"
        [surfaceId]="surfaceId"
      >
      </a2ui-v09-component-host>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() props: Record<string, BoundProperty> = {};
  @Input() surfaceId!: string;
}
