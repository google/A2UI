import React, { useSyncExternalStore, useCallback, useRef } from "react";
import { ComponentContext } from "@a2ui/web_core/v0_9";

const EMPTY_ARRAY: any[] = [];

export const ReactChildList: React.FC<{
  childList: any,
  context: ComponentContext,
  buildChild: (id: string, basePath?: string) => React.ReactNode
}> = ({ childList, context, buildChild }) => {
  if (Array.isArray(childList)) {
    return <>{childList.map((id: string, i: number) => <React.Fragment key={`${id}-${i}`}>{buildChild(id)}</React.Fragment>)}</>;
  }
  
  if (childList && typeof childList === 'object' && childList.path && childList.componentId) {
    const DynamicList = () => {
      const bindingRef = useRef<{ 
        currentVal: any[], 
        listeners: ((v: any[]) => void)[], 
        dataSub?: { removeListener: () => void },
        connect: () => void,
        disconnect: () => void
      } | null>(null);

      if (!bindingRef.current) {
        bindingRef.current = {
          currentVal: EMPTY_ARRAY,
          listeners: [],
          connect() {
            if (this.dataSub) return;
            this.dataSub = context.dataContext.addDynamicValueListener({ path: childList.path }, (v: any) => {
              this.currentVal = Array.isArray(v) ? v : EMPTY_ARRAY;
              this.listeners.forEach(l => l(this.currentVal));
            });
            this.currentVal = Array.isArray((this.dataSub as any).value) ? (this.dataSub as any).value : EMPTY_ARRAY;
          },
          disconnect() {
            if (this.dataSub) {
              this.dataSub.removeListener();
              this.dataSub = undefined;
            }
          }
        };
        // resolve synchronous initial value
        bindingRef.current.currentVal = Array.isArray(context.dataContext.resolveDynamicValue({ path: childList.path })) ? context.dataContext.resolveDynamicValue({ path: childList.path }) as any[] : EMPTY_ARRAY;
      }

      const binding = bindingRef.current;

      const subscribe = useCallback((callback: () => void) => {
        if (binding.listeners.length === 0) binding.connect();
        binding.listeners.push(callback);
        return () => {
          binding.listeners = binding.listeners.filter(l => l !== callback);
          if (binding.listeners.length === 0) binding.disconnect();
        };
      }, [binding]);

      const getSnapshot = useCallback(() => binding.currentVal, [binding]);

      const items = useSyncExternalStore(subscribe, getSnapshot);

      const listContext = context.dataContext.nested(childList.path);

      return (
        <>
          {items.map((_, i) => (
             <React.Fragment key={`${childList.componentId}-${i}`}>
               {buildChild(childList.componentId, listContext.nested(String(i)).path)}
             </React.Fragment>
          ))}
        </>
      );
    };

    return <DynamicList />;
  }

  return null;
};
