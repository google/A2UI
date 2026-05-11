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

import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {DynamicComponent} from '../rendering/dynamic-component';
import {Renderer} from '../rendering/renderer';
import type {AnyComponentNode, ModalNode} from '../types';

@Component({
  selector: 'a2ui-modal',
  imports: [Renderer],
  template: `
    <div class="a2ui-modal-entry-point" (click)="openModal()">
      @if (entryPointChild()) {
        <ng-container a2ui-renderer [surfaceId]="surfaceId()!" [component]="entryPointChild()!" />
      }
    </div>

    @if (isOpen()) {
      <div [class]="theme.components.Modal.backdrop" (click)="closeModal()">
        <div [class]="theme.components.Modal.element" (click)="$event.stopPropagation()">
          @if (contentChild()) {
            <ng-container a2ui-renderer [surfaceId]="surfaceId()!" [component]="contentChild()!" />
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .a2ui-modal-entry-point {
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal extends DynamicComponent<ModalNode> {
  readonly entryPointChild = input.required<AnyComponentNode>();
  readonly contentChild = input.required<AnyComponentNode>();

  protected readonly isOpen = signal(false);

  protected openModal() {
    this.isOpen.set(true);
  }

  protected closeModal() {
    this.isOpen.set(false);
  }
}
