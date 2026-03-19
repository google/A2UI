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

import React, {useSyncExternalStore} from 'react';
import {type SurfaceModel, ComponentContext} from '@a2ui/web_core/v0_9';
import type {ReactComponentImplementation} from './adapter';

export const A2uiSurface: React.FC<{surface: SurfaceModel<ReactComponentImplementation>}> = ({
  surface,
}) => {
  const store = React.useMemo(() => {
    let version = 0;
    return {
      subscribe: (cb: () => void) => {
        const unsub1 = surface.componentsModel.onCreated.subscribe(() => {
          version++;
          cb();
        });
        const unsub2 = surface.componentsModel.onDeleted.subscribe(() => {
          version++;
          cb();
        });
        return () => {
          unsub1.unsubscribe();
          unsub2.unsubscribe();
        };
      },
      getSnapshot: () => version,
    };
  }, [surface]);

  useSyncExternalStore(store.subscribe, store.getSnapshot);

  const renderComponent = (id: string, currentBasePath: string) => {
    try {
      const componentModel = surface.componentsModel.get(id);
      if (!componentModel) {
        return (
          <div key={`loading-${id}`} style={{color: 'gray', padding: '4px'}}>
            [Loading {id}...]
          </div>
        );
      }

      const compImpl = surface.catalog.components.get(componentModel.type);

      if (!compImpl) {
        return (
          <div key={`error-${id}`} style={{color: 'red'}}>
            Unknown component: {componentModel.type}
          </div>
        );
      }

      const ComponentToRender = compImpl.render;
      const context = new ComponentContext(surface, id, currentBasePath);

      const buildChild = (childId: string, specificPath?: string) => {
        return renderComponent(childId, specificPath || context.dataContext.path);
      };

      return (
        <ComponentToRender
          key={`${id}-${currentBasePath}`}
          context={context}
          buildChild={buildChild}
        />
      );
    } catch (e: any) {
      return (
        <div key={`error-${id}`} style={{color: 'red'}}>
          Error rendering {id}: {e.message}
        </div>
      );
    }
  };

  const hasRoot = surface.componentsModel.get('root') !== undefined;

  if (!hasRoot) {
    return <div>Waiting for root component...</div>;
  }

  return <>{renderComponent('root', '/')}</>;
};
