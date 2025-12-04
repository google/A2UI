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

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AgentHeader } from '@rizzcharts/components/chat/agent-header/agent-header';
import { MessageActions } from '@rizzcharts/components/chat/message-actions/message-actions';
import { MessageContent } from '@rizzcharts/components/chat/message/message-content/message-content';
import { ChatService } from '@rizzcharts/services/chat_service';
import { Role, UiAgent, UiMessage } from '@rizzcharts/types/ui_message';

@Component({
  selector: 'message',
  imports: [AgentHeader, MessageActions, MessageContent],
  templateUrl: './message.html',
  styleUrl: './message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Message {
  readonly uiMessage = input.required<UiMessage>();

  protected readonly showProgressIndicator = computed(() => {
    return this.uiMessage().status === 'pending';
  });
  protected readonly surfaces = computed(() => this.chatService.surfaces());

  private readonly chatService = inject(ChatService);

  isRoleAgent(role: Role): role is UiAgent {
    return role.type === 'ui_agent';
  }
}
