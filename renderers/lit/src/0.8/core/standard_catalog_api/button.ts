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
  ButtonNode,
  Action,
} from '../types/types';

export const buttonApi: ComponentApi<'Button', ButtonNode> = {
  name: 'Button',

  resolveProperties(unresolved, resolver) {
    if (!unresolved || typeof unresolved.child !== 'string' || !unresolved.action) {
      throw new Error('Invalid properties for Button: missing child or action.');
    }
    
    return {
      properties: {
        child: resolver(unresolved.child) as AnyResolvedNode,
        action: unresolved.action as Action,
      }
    };
  },
};
