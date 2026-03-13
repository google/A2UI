import React from "react";
import { ComponentContext } from "@a2ui/web_core/v0_9";

export const ReactChildList: React.FC<{
  childList: any,
  context: ComponentContext,
  buildChild: (id: string, basePath?: string) => React.ReactNode
}> = ({ childList, buildChild }) => {
  if (Array.isArray(childList)) {
    return <>{childList.map((item: any, i: number) => {
      // The new binder outputs objects like { id: string, basePath: string } for arrays of structural nodes
      if (item && typeof item === 'object' && item.id) {
        return <React.Fragment key={`${item.id}-${i}`}>{buildChild(item.id, item.basePath)}</React.Fragment>;
      }
      // Fallback for static string lists
      if (typeof item === 'string') {
        return <React.Fragment key={`${item}-${i}`}>{buildChild(item)}</React.Fragment>;
      }
      return null;
    })}</>;
  }
  
  return null;
};
