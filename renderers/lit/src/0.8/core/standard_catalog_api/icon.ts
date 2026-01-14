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
  IconNode,
} from '../types/types';
import { StringValue } from '../types/primitives';

export const iconApi: ComponentApi<'Icon', IconNode> = {
  name: 'Icon',

  resolveProperties(unresolved) {
    if (!unresolved || typeof unresolved.name !== 'object') {
      throw new Error('Invalid properties for Icon: missing name.');
    }

    return {
      properties: {
        name: unresolved.name as StringValue,
      }
    };
  },
};
