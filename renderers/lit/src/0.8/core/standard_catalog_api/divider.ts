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

export interface DividerNode extends BaseResolvedNode<'Divider'> {
  properties: {
    axis?: "horizontal" | "vertical";
    color?: string;
    thickness?: number;
  }
}

export const dividerApi: ComponentApi<'Divider', DividerNode> = {
  name: 'Divider',

  resolveProperties(unresolved, _resolver) {
    return {
      properties: {
        axis: unresolved.axis as DividerNode['properties']['axis'],
        color: unresolved.color as DividerNode['properties']['color'],
        thickness: unresolved.thickness as DividerNode['properties']['thickness'],
      }
    };
  },
};