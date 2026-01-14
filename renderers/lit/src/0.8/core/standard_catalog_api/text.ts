/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law of an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import {
  ComponentApi,
  TextNode,
} from '../types/types';
import { StringValue } from '../types/primitives';

export const textApi: ComponentApi<'Text', TextNode> = {
  name: 'Text',

  resolveProperties(unresolved) {
    if (!unresolved || typeof unresolved.text !== 'object') {
      throw new Error('Invalid properties for Text: missing text.');
    }

    return {
      properties: {
        text: unresolved.text as StringValue,
        usageHint: unresolved.usageHint as TextNode['properties']['usageHint'],
      }
    };
  },
};
