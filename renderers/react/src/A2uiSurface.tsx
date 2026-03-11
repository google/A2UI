import React, { useSyncExternalStore } from 'react';
import { SurfaceModel, ComponentContext } from '@a2ui/web_core/v0_9';
import { ReactText } from './components/ReactText';
import { ReactButton } from './components/ReactButton';
import { ReactRow } from './components/ReactRow';
import { ReactColumn } from './components/ReactColumn';
import { ReactTextField } from './components/ReactTextField';

const componentRegistry: Record<string, React.FC<any>> = {
  "Text": ReactText,
  "Button": ReactButton,
  "Row": ReactRow,
  "Column": ReactColumn,
  "TextField": ReactTextField
};

export const A2uiSurface: React.FC<{ surface: SurfaceModel<any>, basePath?: string }> = ({ surface, basePath = '/' }) => {
  const store = React.useMemo(() => {
    let version = 0;
    return {
      subscribe: (cb: () => void) => {
        const unsub1 = surface.componentsModel.onCreated.subscribe(() => { version++; cb(); });
        const unsub2 = surface.componentsModel.onDeleted.subscribe(() => { version++; cb(); });
        return () => { unsub1.unsubscribe(); unsub2.unsubscribe(); };
      },
      getSnapshot: () => version
    };
  }, [surface]);

  useSyncExternalStore(store.subscribe, store.getSnapshot);

  const renderComponent = (id: string, currentBasePath: string) => {
    try {
      const componentModel = surface.componentsModel.get(id);
      if (!componentModel) {
        return <div key={`loading-${id}`} style={{ color: 'gray', padding: '4px' }}>[Loading {id}...]</div>;
      }
      
      const context = new ComponentContext(surface, id, currentBasePath);
      const ComponentToRender = componentRegistry[componentModel.type];
      
      if (!ComponentToRender) {
        return <div key={`error-${id}`} style={{ color: 'red' }}>Unknown component: {componentModel.type}</div>;
      }
      
      const buildChild = (childId: string, specificPath?: string) => renderComponent(childId, specificPath || context.dataContext.path);

      return <ComponentToRender key={`${id}-${currentBasePath}`} context={context} buildChild={buildChild} />;
    } catch (e: any) {
      return <div key={`error-${id}`} style={{ color: 'red' }}>Error rendering {id}: {e.message}</div>;
    }
  };

  const hasRoot = surface.componentsModel.get('root') !== undefined;

  if (!hasRoot) {
    return <div>Waiting for root component...</div>;
  }

  return <>{renderComponent("root", basePath)}</>;
};
