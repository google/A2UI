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
      context.dispatchAction(props.action);
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
