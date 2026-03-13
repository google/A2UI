import React from "react";
import { createReactComponent } from "../../adapter";
import { TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN, STANDARD_BORDER, STANDARD_RADIUS } from "../utils";

export const ReactTextField = createReactComponent(
  TextFieldApi,
  ({ props, context }) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      props.setValue('value', e.target.value);
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

    const id = `textfield-${context.componentModel.id}`;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%", margin: LEAF_MARGIN }}>
        {props.label && <label htmlFor={id} style={{ fontSize: "14px", fontWeight: "bold" }}>{props.label}</label>}
        {isLong ? (
          <textarea id={id} style={style} value={props.value || ""} onChange={onChange} />
        ) : (
          <input id={id} type={type} style={style} value={props.value || ""} onChange={onChange} />
        )}
      </div>
    );
  }
);
