import React from "react";
import { createReactComponent, createGenericBinding } from "../adapter";
import type { ReactA2uiComponentProps } from "../adapter";
import { z } from "zod";
import { ComponentContext, CommonSchemas } from "@a2ui/web_core/v0_9";

export const TextFieldSchema = z.object({
  label: CommonSchemas.DynamicString,
  value: CommonSchemas.DynamicString,
  variant: z.enum(["longText", "number", "shortText", "obscured"]).optional(),
  validationRegexp: z.string().optional()
});

export type TextFieldProps = {
  label?: string;
  value?: string;
  variant?: string;
  validationRegexp?: string;
};

const RenderTextField: React.FC<ReactA2uiComponentProps<TextFieldProps>> = ({ props, context }) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valueProp = context.componentModel.properties.value;
    if (valueProp && typeof valueProp === 'object' && valueProp.path) {
       context.dataContext.set(valueProp.path, e.target.value);
    }
  };

  const isLong = props.variant === "longText";
  const type = props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text";

  const style: React.CSSProperties = {
    padding: "8px",
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: "4px",
    boxSizing: "border-box"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
      {props.label && <label style={{ fontSize: "14px", fontWeight: "bold" }}>{props.label}</label>}
      {isLong ? (
        <textarea style={style} value={props.value || ""} onChange={onChange} />
      ) : (
        <input type={type} style={style} value={props.value || ""} onChange={onChange} />
      )}
    </div>
  );
};

export const ReactTextField = createReactComponent<TextFieldProps>(
  (ctx: ComponentContext) => createGenericBinding<TextFieldProps>(ctx, ["variant", "validationRegexp"]),
  RenderTextField
);

export const TextFieldApiDef = {
  name: "TextField",
  schema: TextFieldSchema
};
