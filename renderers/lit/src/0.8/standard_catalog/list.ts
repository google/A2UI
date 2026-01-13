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

import { CatalogItem } from '../catalog/catalog_item.js';
import { isResolvedList } from '../data/guards.js';
import { AnyComponentNode, ResolvedMap } from '../types/types.js';

export const listCatalogItem: CatalogItem = {
  typeName: 'List',
  buildNode(
    baseNode: { id: string; dataContextPath: string; weight: number | 'initial' },
    resolvedProperties: ResolvedMap,
    objCtor: ObjectConstructor
  ): AnyComponentNode {
    if (!isResolvedList(resolvedProperties)) {
      throw new Error('Invalid properties for List component');
    }
    return new objCtor({
      ...baseNode,
      type: 'List',
      properties: resolvedProperties,
    }) as AnyComponentNode;
  }
};
