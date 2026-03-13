import React from "react";
import { createReactComponent } from "../../adapter";
import { TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS } from "../utils";

export const ReactTextField = createReactComponent(
  TextFieldApi,
  ({ props }) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      props.setValue(e.target.value);
    };

    const isLong = props.variant === "longText";
    const type = props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text";

    const style: React.CSSProperties = {
      padding: "8px",
      width: "100%",
      border: STANDARD_BORDER,
      borderRadius: STANDARD_RADIUS,
      boxSizing: "border-box"
    };

    // Note: To have a unique id without passing context we can use a random or provided id,
    // but the simplest is just relying on React's useId if we really need it.
    // For now, we'll omit the `id` from the label connection since we removed context.
    const uniqueId = React.useId();

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", margin: LEAF_MARGIN }}>
        {props.label && <label htmlFor={uniqueId} style={{ fontSize: "14px", fontWeight: "bold" }}>{props.label}</label>}
        {isLong ? (
          <textarea id={uniqueId} style={style} value={props.value || ""} onChange={onChange} />
        ) : (
          <input id={uniqueId} type={type} style={style} value={props.value || ""} onChange={onChange} />
        )}
      </div>
    );
  }
);
