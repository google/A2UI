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

import { Part, SendMessageResponse, SendMessageSuccessResponse } from '@a2a-js/sdk';
import { Injectable } from '@angular/core';
import * as v0_8 from '@a2ui/web-lib/0.8';

@Injectable({ providedIn: 'root' })
export class A2aService {

  public supportedCatalogUris: string[] = [];

  async sendMessage(message: v0_8.Types.A2UIClientEventMessage, contextId?: string): Promise<SendMessageSuccessResponse> {
    const response = await fetch('/a2a', {
      body: JSON.stringify({
        'parts': message.request as Part[], 
        'metadata': { 
          "clientUiCapabilities": { 
            "supportedCatalogUris": this.supportedCatalogUris 
          } 
        }, 
        'context_id': contextId
      }),
      method: 'POST',
    });

    if (response.ok) {
      return await response.json();
    }

    const error = (await response.json()) as { error: string };
    throw new Error(error.error);
  }
}
