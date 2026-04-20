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

import { Part } from '@a2a-js/sdk';
import {
  A2uiMessage,
  CreateSurfaceMessage,
  UpdateComponentsMessage,
  UpdateDataModelMessage,
  DeleteSurfaceMessage,
} from '@a2ui/web_core/v0_9';
import { isA2aDataPart } from './type-guards';

/**
 * Extracts A2UI messages from an array of A2A Parts.
 * It filters for parts that are A2A DataParts and maps them to A2UI v0.9 messages
 * based on the presence of specific operation keys (e.g., 'createSurface', 'updateComponents').
 *
 * @param parts An array of A2A Parts.
 * @returns An array of A2uiMessage objects.
 */
export function extractA2uiDataParts(parts: Part[]): A2uiMessage[] {
  return parts.reduce<A2uiMessage[]>((messages, part) => {
    if (isA2aDataPart(part)) {
      if (part.data && typeof part.data === 'object') {
        // Indexed access is used in the branches below because the payload types are defined inline
        // in the message interfaces (e.g., CreateSurfaceMessage) and do not have separate named exports.
        if ('createSurface' in part.data) {
          messages.push({
            version: 'v0.9',
            createSurface: part.data['createSurface'] as CreateSurfaceMessage['createSurface'],
          });
        } else if ('updateComponents' in part.data) {
          messages.push({
            version: 'v0.9',
            updateComponents: part.data[
              'updateComponents'
            ] as UpdateComponentsMessage['updateComponents'],
          });
        } else if ('updateDataModel' in part.data) {
          messages.push({
            version: 'v0.9',
            updateDataModel: part.data[
              'updateDataModel'
            ] as UpdateDataModelMessage['updateDataModel'],
          });
        } else if ('deleteSurface' in part.data) {
          messages.push({
            version: 'v0.9',
            deleteSurface: part.data['deleteSurface'] as DeleteSurfaceMessage['deleteSurface'],
          });
        }
      }
    }
    return messages;
  }, []);
}
