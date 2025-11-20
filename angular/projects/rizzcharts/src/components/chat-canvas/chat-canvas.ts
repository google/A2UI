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

import { Component, computed, inject } from '@angular/core';
import { Canvas } from '@rizzcharts/components/canvas/canvas';
import { Chat } from '@rizzcharts/components/chat/chat';
import { CanvasService } from '@rizzcharts/services/canvas_service';

@Component({
  selector: 'chat-canvas',
  imports: [Canvas, Chat],
  templateUrl: './chat-canvas.html',
  styleUrl: './chat-canvas.scss',
})
export class ChatCanvas {
  private readonly canvasService = inject(CanvasService);

  readonly surfaceId = computed(() => this.canvasService.surfaceId());
  readonly canvasContents = computed(() => this.canvasService.contents());
}
