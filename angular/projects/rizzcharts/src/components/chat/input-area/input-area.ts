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

import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { ChatService } from '@rizzcharts/services/chat_service';

/** Input area for the user to enter text. */
@Component({
  selector: 'input-area',
  templateUrl: './input-area.html',
  styleUrls: ['./input-area.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkTextareaAutosize,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatTooltip,
    ReactiveFormsModule,
  ],
})
export class InputArea {
  readonly chatService = inject(ChatService);
  readonly cancelOngoingStream = output<void>();

  protected readonly formGroup = new FormGroup({
    query: new FormControl('', {
      nonNullable: true,
    }),
  });

  protected readonly form = viewChild.required<ElementRef<HTMLFormElement>>('form');
  protected readonly textarea = viewChild.required<ElementRef<HTMLTextAreaElement>>('textarea');

  protected submitIfEnterKeydownEvent(event: Event) {
    if (
      !isKeyboardEvent(event) ||
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    event.preventDefault();
    this.form().nativeElement.requestSubmit();
  }

  protected validateLogAndRequestSendMessage() {
    if (this.formGroup.controls.query.value.trim() === '') {
      return;
    }

    this.cancelOngoingStream.emit();
    this.chatService.sendMessage(this.formGroup.value.query!);
    this.formGroup.reset();
  }

  protected cancelOngoingStreamAndFocusInput() {
    this.cancelOngoingStream.emit();
    this.textarea().nativeElement.focus();
  }
}

function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event.type === 'keydown';
}
