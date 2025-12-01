/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { DataPart, TextPart } from '@a2a-js/sdk';
import { Surface } from '@a2ui/angular';
import * as v0_8 from '@a2ui/web-lib/0.8';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { ChatService } from '@rizzcharts/services/chat_service';
import { UiMessageContent } from '@rizzcharts/types/ui_message';

@Component({
  selector: 'message-content',
  imports: [Surface],
  templateUrl: './message-content.html',
  styleUrl: './message-content.scss',
})
export class MessageContent {
  private readonly chatService = inject(ChatService);

  readonly uiMessageContent = input.required<UiMessageContent>();

  protected readonly surfaces = computed(() => this.chatService.surfaces());

  protected readonly text: Signal<string | null> = computed(() => {
    if (this.uiMessageContent().data.kind !== 'text') {
      return null;
    }

    return (this.uiMessageContent().data as TextPart).text;
  });

  protected readonly a2uiSurface: Signal<string | null> = computed(() => {
    if (this.uiMessageContent().data.kind !== 'data') {
      return null;
    }

    const beginRenderingPart = (this.uiMessageContent().data as DataPart).data[
      'beginRendering'
    ] as v0_8.Types.BeginRenderingMessage;

    return beginRenderingPart.surfaceId;
  });
}
