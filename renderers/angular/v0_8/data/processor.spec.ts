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

import { TestBed } from '@angular/core/testing';
import { MessageProcessor } from './processor';
import * as Types from '@a2ui/web_core/v0_8';

describe('MessageProcessor', () => {
  let service: MessageProcessor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageProcessor],
    });
    service = TestBed.inject(MessageProcessor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should dispatch events and resolve with response', async () => {
    const message: Types.A2UIClientEventMessage = {
      userAction: {
        name: 'click',
        sourceComponentId: 'btn1',
        surfaceId: 's1',
        timestamp: new Date().toISOString(),
      },
    };

    const response: Types.ServerToClientMessage[] = [
      {
        type: 'update',
        node: {
          id: 'text1',
          type: 'text',
          properties: { value: 'Updated' },
        },
      } as any,
    ];

    let dispatchedEvent: any;
    service.events.subscribe((event) => {
      dispatchedEvent = event;
      // Simulate server response
      event.completion.next(response);
      event.completion.complete();
    });

    const result = await service.dispatch(message);

    expect(dispatchedEvent).toBeDefined();
    expect(dispatchedEvent.message).toEqual(message);
    expect(result).toEqual(response);
  });

  it('should override setData and handle null surfaceId', () => {
    const node: any = { id: 'node1' };
    const spy = spyOn(
      Object.getPrototypeOf(MessageProcessor.prototype),
      'setData',
    ).and.callThrough();

    service.setData(node, 'path', 'value', null);

    expect(spy).toHaveBeenCalledWith(node, 'path', 'value', undefined);
  });
});
