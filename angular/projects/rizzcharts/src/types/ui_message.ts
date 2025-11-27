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

import { Artifact, Part } from '@a2a-js/sdk';

export interface UiMessage {
  readonly type: 'ui_message';
  readonly id: string;
  readonly context_id: string;
  readonly role: Role;
  readonly contents: UiMessageContent[];
  readonly status: UiMessageStatus;
  readonly created: string;
  readonly lastUpdated: string;
}

export type Role = UiAgent | UiUser;

export interface UiAgent {
  readonly type: 'ui_agent';
  readonly name: string;
  readonly icon_url: string;
}

export interface UiUser {
  readonly type: 'ui_user';
}

export interface UiMessageContent {
  readonly type: 'ui_message_content';
  readonly id: string;
  readonly data: Part;
}

export type UiMessageStatus = 'completed' | 'pending' | 'cancelled';
