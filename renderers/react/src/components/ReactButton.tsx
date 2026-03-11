import React from "react";
import { createReactComponent, createGenericBinding } from "../adapter";
import type { ReactA2uiComponentProps } from "../adapter";
import { z } from "zod";
import { ComponentContext, CommonSchemas } from "@a2ui/web_core/v0_9";

export const ButtonSchema = z.object({
  child: CommonSchemas.ComponentId,
  action: CommonSchemas.Action,
  variant: z.enum(["primary", "borderless"]).optional()
});

export type ButtonProps = {
  child?: string;
  action?: any;
  variant?: string;
};

const RenderButton: React.FC<ReactA2uiComponentProps<ButtonProps>> = ({ props, buildChild, context }) => {
  const onClick = () => {
    if (props.action) {
      // Helper to recursively resolve dynamic values in objects/arrays
      const resolveDeep = (val: any): any => {
        if (typeof val !== 'object' || val === null) return val;
        
        // If it's a dynamic value (path or call), resolve it
        if ('path' in val || 'call' in val) {
          return context.dataContext.resolveDynamicValue(val);
        }

        if (Array.isArray(val)) {
          return val.map(resolveDeep);
        }

        const resolved: any = {};
        for (const [k, v] of Object.entries(val)) {
          resolved[k] = resolveDeep(v);
        }
        return resolved;
      };

      const resolvedAction = resolveDeep(props.action);
      context.dispatchAction(resolvedAction);
    }
  };

  const style: React.CSSProperties = {
    padding: "8px 16px",
    cursor: "pointer",
    border: props.variant === "borderless" ? "none" : "1px solid #ccc",
    backgroundColor: props.variant === "primary" ? "#007bff" : "transparent",
    color: props.variant === "primary" ? "#fff" : "inherit",
    borderRadius: "4px"
  };

  return (
    <button style={style} onClick={onClick}>
      {props.child ? buildChild(props.child) : null}
    </button>
  );
};

export const ReactButton = createReactComponent<ButtonProps>(
  (ctx: ComponentContext) => createGenericBinding<ButtonProps>(ctx, ["child", "action", "variant"]),
  RenderButton
);

export const ButtonApiDef = {
  name: "Button",
  schema: ButtonSchema
};
