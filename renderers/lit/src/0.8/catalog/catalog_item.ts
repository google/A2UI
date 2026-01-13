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

import { AnyComponentNode, ResolvedMap } from '../types/types.js';

export interface CatalogItem {
  /** The component type name (e.g., "Text"). */
  readonly typeName: string;

  /**
   * Validates the resolved properties and builds a typed component node.
   * @param baseNode The common properties (id, dataContextPath, weight) for the node.
   * @param resolvedProperties The properties of the component after resolving all data bindings and children.
   * @param objCtor The object constructor to use (to support signal-based objects).
   * @returns A typed `AnyComponentNode` or throws an error if validation fails.
   */
  buildNode(
    baseNode: { id: string; dataContextPath: string; weight: number | 'initial' },
    resolvedProperties: ResolvedMap,
    objCtor: ObjectConstructor
  ): AnyComponentNode;
}
