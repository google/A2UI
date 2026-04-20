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

import { Part } from '@a2a-js/sdk';
import { RendererComponent } from '@a2a_chat_canvas/a2a-renderer/types';
import { UiMessageContent } from '@a2a_chat_canvas/types/ui-message';
import { isA2aDataPart } from '@a2a_chat_canvas/utils/type-guards';
import { SurfaceComponent } from '@a2ui/angular';
import { CreateSurfaceMessage } from '@a2ui/web_core/v0_9';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Component responsible for rendering an A2UI surface embedded within an A2A message part.
 * It extracts the surface ID from the 'createSurface' message and uses the A2UI Surface component to render it.
 */
@Component({
  selector: 'a2ui-data-part',
  templateUrl: './a2ui-data-part.html',
  styleUrl: './a2ui-data-part.scss',
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class A2uiDataPart implements RendererComponent {
  /** The UiMessageContent containing the A2A data part with the embedded A2UI message. */
  readonly uiMessageContent = input.required<UiMessageContent>();

  /** Computes the surface ID from the 'createSurface' message within the A2A data part. */
  protected readonly a2uiSurfaceId = computed(() => {
    const part = this.uiMessageContent().data as Part;
    if (isA2aDataPart(part)) {
      if (part.data && typeof part.data === 'object' && 'createSurface' in part.data) {
        const createSurfaceMessage = part.data[
          'createSurface'
        ] as CreateSurfaceMessage['createSurface'];
        return createSurfaceMessage.surfaceId;
      }
    }

    return undefined;
  });
}
