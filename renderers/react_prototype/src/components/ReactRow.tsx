import React from "react";
import { createReactComponent } from "../adapter";
import type { ReactA2uiComponentProps } from "../adapter";
import { z } from "zod";
import { CommonSchemas } from "@a2ui/web_core/v0_9";
import { ReactChildList } from "./ReactChildList";

export const RowSchema = z.object({
  children: CommonSchemas.ChildList,
  justify: z.enum(["center", "end", "spaceAround", "spaceBetween", "spaceEvenly", "start", "stretch"]).optional(),
  align: z.enum(["start", "center", "end", "stretch"]).optional()
});

export type RowProps = {
  children?: any;
  justify?: string;
  align?: string;
};

const mapJustify = (j?: string) => {
  switch(j) {
    case "center": return "center";
    case "end": return "flex-end";
    case "spaceAround": return "space-around";
    case "spaceBetween": return "space-between";
    case "spaceEvenly": return "space-evenly";
    case "start": return "flex-start";
    case "stretch": return "stretch";
    default: return "flex-start";
  }
}

const mapAlign = (a?: string) => {
  switch(a) {
    case "start": return "flex-start";
    case "center": return "center";
    case "end": return "flex-end";
    case "stretch": return "stretch";
    default: return "stretch";
  }
}

const RenderRow: React.FC<ReactA2uiComponentProps<RowProps>> = ({ props, buildChild, context }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: mapJustify(props.justify), alignItems: mapAlign(props.align) }}>
      <ReactChildList childList={props.children} buildChild={buildChild} context={context} />
    </div>
  );
};

export const RowApiDef = {
  name: "Row",
  schema: RowSchema
};

export const ReactRow = createReactComponent<RowProps>(
  RowApiDef,
  RenderRow
);
