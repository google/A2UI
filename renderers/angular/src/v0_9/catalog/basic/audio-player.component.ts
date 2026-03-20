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

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { BoundProperty } from '../../core/types';

/**
 * Angular implementation of the A2UI AudioPlayer component (v0.9).
 *
 * Renders an audio player with standard controls and an optional description.
 */
@Component({
  selector: 'a2ui-v09-audio-player',
  standalone: true,
  imports: [],
  template: `
    <div class="a2ui-audio-player">
      @if (description()) {
        <div class="a2ui-audio-description">
          {{ description() }}
        </div>
      }
      <audio [attr.src]="url() || null" controls class="a2ui-audio">
        Your browser does not support the audio tag.
      </audio>
    </div>
  `,
  styles: [
    `
      .a2ui-audio-player {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }
      .a2ui-audio-description {
        font-size: 14px;
        color: #666;
      }
      .a2ui-audio {
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioPlayerComponent {
  /**
   * Reactive properties resolved from the A2UI {@link ComponentModel}.
   *
   * Expected properties:
   * - `url`: The absolute URL of the audio file.
   * - `description`: Optional text to display above the player.
   */
  props = input<Record<string, BoundProperty>>({});
  surfaceId = input<string>();
  componentId = input<string>();
  dataContextPath = input<string>();

  description = computed(() => this.props()['description']?.value());
  url = computed(() => this.props()['url']?.value());
}
