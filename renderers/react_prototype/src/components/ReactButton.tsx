import React from "react";
import { createReactComponent } from "../adapter";
import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";

export const ButtonSchema = z.object({
  child: CommonSchemas.ComponentId,
  action: CommonSchemas.Action,
  variant: z.enum(["primary", "borderless"]).optional()
});

export const ButtonApiDef = {
  name: "Button",
  schema: ButtonSchema
};

export const ReactButton = createReactComponent(
  ButtonApiDef,
  ({ props, buildChild }) => {
    const style: React.CSSProperties = {
      padding: "8px 16px",
      cursor: "pointer",
      border: props.variant === "borderless" ? "none" : "1px solid #ccc",
      backgroundColor: props.variant === "primary" ? "#007bff" : "transparent",
      color: props.variant === "primary" ? "#fff" : "inherit",
      borderRadius: "4px"
    };

    return (
      <button style={style} onClick={props.action}>
        {props.child ? buildChild(props.child) : null}
      </button>
    );
  }
);
