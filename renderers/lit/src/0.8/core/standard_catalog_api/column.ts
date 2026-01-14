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
  AnyResolvedNode,
  ColumnNode,
} from '../types/types';

export const columnApi: ComponentApi<'Column', ColumnNode> = {
  name: 'Column',

  resolveProperties(unresolved, resolver) {
    if (!unresolved || !unresolved.children) {
      throw new Error('Invalid properties for Column: missing children.');
    }
    
    return {
      properties: {
        children: resolver(unresolved.children) as AnyResolvedNode[],
        distribution: unresolved.distribution as ColumnNode['properties']['distribution'],
        alignment: unresolved.alignment as ColumnNode['properties']['alignment'],
      }
    };
  },
};
