import React from "react";
import { createReactComponent } from "../../adapter";
import { ButtonApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN } from "../utils";

export const ReactButton = createReactComponent(
  ButtonApi,
  ({ props, buildChild }) => {
    const style: React.CSSProperties = {
      margin: LEAF_MARGIN,
      padding: "8px 16px",
      cursor: "pointer",
      border: props.variant === "borderless" ? "none" : "1px solid #ccc",
      backgroundColor: props.variant === "primary" ? "var(--a2ui-primary-color, #007bff)" : props.variant === "borderless" ? "transparent" : "#fff",
      color: props.variant === "primary" ? "#fff" : "inherit",
      borderRadius: "4px",
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box'
    };

    return (
      <button style={style} onClick={props.action}>
        {props.child ? buildChild(props.child) : null}
      </button>
    );
  }
);
