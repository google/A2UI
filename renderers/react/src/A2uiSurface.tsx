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
  const hasRoot = useSyncExternalStore(
    (cb) => {
      const unsub1 = surface.componentsModel.addComponentCreatedListener((_c) => {
        if (_c.id === 'root') cb();
      });
      const unsub2 = surface.componentsModel.addComponentDeletedListener((id: string) => {
        if (id === 'root') cb();
      });
      return () => { unsub1(); unsub2(); };
    },
    () => surface.componentsModel.get('root') !== undefined
  );

  const buildChild = (id: string, path?: string) => {
    try {
      const componentModel = surface.componentsModel.get(id);
      if (!componentModel) {
        return <div key={`loading-${id}`} style={{ color: 'gray', padding: '4px' }}>[Loading {id}...]</div>;
      }
      
      const context = new ComponentContext(surface, id, path || basePath);
      const ComponentToRender = componentRegistry[componentModel.type];
      
      if (!ComponentToRender) {
        return <div key={`error-${id}`} style={{ color: 'red' }}>Unknown component: {componentModel.type}</div>;
      }
      
      return <ComponentToRender key={`${id}-${path || basePath}`} context={context} buildChild={buildChild} />;
    } catch (e: any) {
      return <div key={`error-${id}`} style={{ color: 'red' }}>Error rendering {id}: {e.message}</div>;
    }
  };

  if (!hasRoot) {
    return <div>Waiting for root component...</div>;
  }

  return <>{buildChild("root", basePath)}</>;
};
