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

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ChatHistory } from '@rizzcharts/components/chat/chat-history/chat-history';
import { InputArea } from '@rizzcharts/components/chat/input-area/input-area';
import { ChatService } from '@rizzcharts/services/chat_service';

@Component({
  selector: 'chat',
  imports: [ChatHistory, InputArea],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat {
  private chatService = inject(ChatService);

  readonly history = computed(() => this.chatService.history());
}
