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

import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Message } from '@rizzcharts/components/chat/message/message';
import { ChatService } from '@rizzcharts/services/chat_service';
import { UiMessage } from '@rizzcharts/types/ui_message';

@Component({
  selector: 'chat-history',
  imports: [Message, NgTemplateOutlet, MatButtonModule],
  templateUrl: './chat-history.html',
  styleUrl: './chat-history.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHistory {
  readonly chatService = inject(ChatService);
  readonly history = input.required<UiMessage[]>();
  readonly surfaces = computed(() => {
    console.log('surfaces updated');
    console.log(JSON.stringify(this.chatService.surfaces()));
    return this.chatService.surfaces();
  });

  readonly emptyHistoryTemplate = input<TemplateRef<unknown>>();

  protected readonly historyByTurn = computed(() => {
    const history = this.history();
    const historyByTurn: UiMessage[][] = [];
    let currentTurn: UiMessage[] = [];
    for (const message of history) {
      const currentTurnContainsSameSender = currentTurn.some(
        (m) => m.role.type === message.role.type,
      );
      if (currentTurnContainsSameSender) {
        historyByTurn.push(currentTurn);
        currentTurn = [];
      }
      currentTurn.push(message);
    }
    if (currentTurn.length > 0) {
      historyByTurn.push(currentTurn);
    }
    console.log(JSON.stringify(historyByTurn));
    return historyByTurn;
  });

  private readonly turnContainers = viewChildren<ElementRef<HTMLElement>>('turnContainer');

  constructor() {
    // When the number of turn containers changes it means that the history has
    // been updated and we should scroll to the newly added last turn container.
    afterRenderEffect({
      write: () => {
        const turnContainers = this.turnContainers();
        const turnContainer = turnContainers.at(-1)?.nativeElement;
        turnContainer?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        });
      },
    });
  }

  sendMessage(text: string) {
    this.chatService.sendMessage(text);
  }
}
