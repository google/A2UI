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
  MultipleChoiceNode,
} from '../types/types';
import { StringValue } from '../types/primitives';

export const multipleChoiceApi: ComponentApi<'MultipleChoice', MultipleChoiceNode> = {
  name: 'MultipleChoice',

  resolveProperties(unresolved) {
    if (!unresolved || typeof unresolved.selections !== 'object' || !Array.isArray(unresolved.options)) {
      throw new Error('Invalid properties for MultipleChoice: missing selections or options.');
    }

    return {
      properties: {
        selections: unresolved.selections as { path?: string; literalArray?: string[] },
        options: unresolved.options as { label: StringValue, value: string }[],
        maxAllowedSelections: unresolved.maxAllowedSelections as number,
      }
    };
  },
};
