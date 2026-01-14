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

import {
  ComponentApi,
  BaseResolvedNode,
} from '../types/types.js';
import { StringValue } from '../types/primitives.js';

export interface VideoNode extends BaseResolvedNode<'Video'> {
  properties: {
    url: StringValue;
  }
}

export const videoApi: ComponentApi<'Video', VideoNode> = {
  name: 'Video',

  resolveProperties(unresolved, resolver) {
    if (!unresolved || typeof unresolved.url !== 'object') {
      throw new Error('Invalid properties for Video: missing url.');
    }

    return {
      properties: {
        url: resolver(unresolved.url) as StringValue,
      }
    };
  },
};