/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import {type A2uiNode} from '@a2ui/web_core/v0_9';
import {NodeRenderer} from '../../../A2uiSurface';

export const ChildList: React.FC<{
  childList: unknown;
  buildChild?: (nodeOrId: any) => React.ReactNode;
}> = ({childList, buildChild}) => {
  if (Array.isArray(childList)) {
    return (
      <>
        {childList.map((item: unknown) => {
          if (buildChild) {
             return buildChild(item);
          }
          // Fallback if buildChild isn't provided for some reason
          if (item && typeof item === 'object' && 'instanceId' in item) {
            const node = item as A2uiNode;
            return <NodeRenderer key={node.instanceId} node={node} />;
          }
          return null;
        })}
      </>
    );
  }

  return null;
};
