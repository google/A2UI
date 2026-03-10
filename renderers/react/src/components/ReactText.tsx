import React from "react";
import { createReactComponent, createGenericBinding } from "../adapter";
import { z } from "zod";
import { ComponentContext, CommonSchemas } from "@a2ui/web_core/v0_9";

export const TextSchema = z.object({
  text: CommonSchemas.DynamicString,
  variant: z.enum(["h1", "h2", "h3", "h4", "h5", "caption", "body"]).optional()
});

export type TextProps = {
  text?: string;
  variant?: string;
};

const RenderText: React.FC<{ props: TextProps }> = ({ props }) => {
  const text = props.text ?? "";
  switch (props.variant) {
    case "h1": return <h1>{text}</h1>;
    case "h2": return <h2>{text}</h2>;
    case "h3": return <h3>{text}</h3>;
    case "h4": return <h4>{text}</h4>;
    case "h5": return <h5>{text}</h5>;
    case "caption": return <small>{text}</small>;
    case "body":
    default: return <span>{text}</span>;
  }
};

export const ReactText = createReactComponent<TextProps>(
  (ctx: ComponentContext) => createGenericBinding<TextProps>(ctx, []),
  RenderText as any
);

export const TextApiDef = {
  name: "Text",
  schema: TextSchema
};
