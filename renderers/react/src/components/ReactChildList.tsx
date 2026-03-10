import React, { useSyncExternalStore } from "react";
import { ComponentContext } from "@a2ui/web_core/v0_9";

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
      const items = useSyncExternalStore(
        (callback) => {
          const bound = context.dataContext.addDynamicValueListener({ path: childList.path }, callback);
          return () => bound.removeListener();
        },
        () => {
          let currentVal: any[] | undefined;
          context.dataContext.addDynamicValueListener({ path: childList.path }, (v: any) => { currentVal = v as any; }).removeListener();
          return Array.isArray(currentVal) ? currentVal : [];
        }
      );

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
