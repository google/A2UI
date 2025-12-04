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

import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SafeUrl } from '@angular/platform-browser';
import { Avatar } from '../avatar/avatar';

@Component({
  selector: 'agent-header',
  imports: [Avatar, MatButton, MatIcon],
  templateUrl: './agent-header.html',
  styleUrl: './agent-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentHeader {
  private static instanceCount = 0;

  readonly agentIconUrl = input<string | SafeUrl | undefined>(undefined);
  readonly agentName = input<string | undefined>(undefined);
  readonly showProgressIndicator = input<boolean>(false);
  readonly statusText = input<string | undefined>(undefined);

  protected readonly expanded = signal<boolean>(false);
  protected readonly containsAgentThoughts = signal(true);
  private readonly instanceId = AgentHeader.instanceCount++;
  protected readonly agentThoughtsButtonId = `view-agent-thoughts-button-${this.instanceId}`;
  protected readonly agentThoughtsContentId = `agent-thoughts-content-${this.instanceId}`;
}
