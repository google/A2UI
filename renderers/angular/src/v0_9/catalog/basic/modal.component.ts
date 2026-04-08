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

import { Component, input, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { ComponentHostComponent } from '../../core/component-host.component';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI Modal component (v0.9).
 *
 * Renders a trigger component that opening an overlay containing a content component.
 */
@Component({
  selector: 'a2ui-v09-modal',
  standalone: true,
  imports: [ComponentHostComponent],
  template: `
    <div class="a2ui-modal-wrapper">
      <div (click)="openModal()" class="a2ui-modal-trigger">
        @if (normalizedTrigger()) {
          <a2ui-v09-component-host
            [componentKey]="normalizedTrigger()!"
            [surfaceId]="surfaceId()"
          >
          </a2ui-v09-component-host>
        }
      </div>

      @if (isOpen()) {
        <div class="a2ui-modal-overlay" (click)="closeModal()">
          <div class="a2ui-modal-content" (click)="$event.stopPropagation()">
            <button class="a2ui-modal-close" (click)="closeModal()">&times;</button>
            @if (normalizedContent()) {
              <a2ui-v09-component-host
                [componentKey]="normalizedContent()!"
                [surfaceId]="surfaceId()"
              >
              </a2ui-v09-component-host>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .a2ui-modal-wrapper {
        display: inline-block;
      }
      .a2ui-modal-trigger {
        cursor: pointer;
      }
      .a2ui-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      .a2ui-modal-content {
        background: white;
        padding: 32px;
        border-radius: 8px;
        position: relative;
        min-width: 300px;
        max-width: 80%;
        max-height: 80%;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      }
      .a2ui-modal-close {
        position: absolute;
        top: 10px;
        right: 15px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
      }
      .a2ui-modal-close:hover {
        color: #333;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `trigger`: The ID of the component that opens the modal.
   * - `content`: The ID of the component to display inside the modal.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input.required<string>();
  componentId = input<string>();
  dataContextPath = input<string>('/');

  isOpen = signal(false);

  trigger = computed(() => this.props()['trigger']?.value());
  content = computed(() => this.props()['content']?.value());

  protected normalizedTrigger = computed(() => {
    const trigger = this.trigger();
    if (!trigger) return null;
    if (typeof trigger === 'object' && trigger !== null && 'id' in trigger) {
      return trigger as { id: string; basePath: string };
    }
    return { id: trigger as string, basePath: this.dataContextPath() };
  });

  protected normalizedContent = computed(() => {
    const content = this.content();
    if (!content) return null;
    if (typeof content === 'object' && content !== null && 'id' in content) {
      return content as { id: string; basePath: string };
    }
    return { id: content as string, basePath: this.dataContextPath() };
  });

  openModal() {
    this.isOpen.set(true);
  }

  closeModal() {
    this.isOpen.set(false);
  }
}
