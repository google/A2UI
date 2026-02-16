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

import { A2uiMessageProcessor } from '@a2ui/web_core/data/model-processor';
import * as Types from '@a2ui/web_core/types/types';
import { inject, provide, reactive, type InjectionKey } from 'vue';

export interface DispatchedEvent {
  message: Types.A2UIClientEventMessage;
  resolve: (messages: Types.ServerToClientMessage[]) => void;
  reject: (error: Error) => void;
}

export class MessageProcessor extends A2uiMessageProcessor {
  private eventHandlers: Set<(event: DispatchedEvent) => void> = new Set();

  constructor() {
    super();
  }

  override setData(
    node: Types.AnyComponentNode,
    relativePath: string,
    value: Types.DataValue,
    surfaceId?: Types.SurfaceID | null,
  ) {
    return super.setData(node, relativePath, value, surfaceId ?? undefined);
  }

  dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
    return new Promise((resolve, reject) => {
      const event: DispatchedEvent = { message, resolve, reject };
      this.eventHandlers.forEach((handler) => handler(event));
    });
  }

  onEvent(handler: (event: DispatchedEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }
}

export const MESSAGE_PROCESSOR_KEY: InjectionKey<MessageProcessor> = Symbol('message-processor');

export function useMessageProcessor(): MessageProcessor {
  let processor = inject(MESSAGE_PROCESSOR_KEY, null);

  if (!processor) {
    processor = reactive(new MessageProcessor()) as MessageProcessor;
    provide(MESSAGE_PROCESSOR_KEY, processor);
  }

  return processor;
}
