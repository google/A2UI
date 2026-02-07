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

import * as Types from '@a2ui/web_core/types/types';

export function createSingleComponentSurface(type: string, properties: Record<string, unknown>): Types.Surface {
  const rootId = 'root';
  return {
    rootComponentId: rootId,
    dataModel: new Map(),
    styles: {},
    componentTree: {
      id: rootId,
      type: type,
      properties: properties,
    } as Types.AnyComponentNode,
    components: new Map(),
  };
}

export function createComponent(type: string, properties: Record<string, unknown>): Types.AnyComponentNode {
  return {
    id: 'generated-' + Math.random().toString(36).substr(2, 9),
    type: type,
    properties: properties,
  } as Types.AnyComponentNode;
}

export function getJson(surface: Types.Surface): string {
  return JSON.stringify(
    surface,
    (key, value) => {
      if (key === 'rootComponentId' || key === 'dataModel' || key === 'styles') return undefined;
      if (value instanceof Map) return Object.fromEntries(value.entries());
      return value;
    },
    2,
  );
}
