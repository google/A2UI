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
  TextFieldNode,
} from '../types/types.js';
import { StringValue } from '../types/primitives.js';

export const textFieldApi: ComponentApi<'TextField', TextFieldNode> = {
  name: 'TextField',

  resolveProperties(unresolved, resolver) {
    if (!unresolved || typeof unresolved.label !== 'object') {
      throw new Error('Invalid properties for TextField: missing label.');
    }

    return {
      properties: {
        label: resolver(unresolved.label) as StringValue,
        text: resolver(unresolved.text) as StringValue,
        type: unresolved.type as TextFieldNode['properties']['type'],
        validationRegexp: unresolved.validationRegexp as string,
      }
    };
  },
};
