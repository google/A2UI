import { createReactComponent } from "../../adapter";
import { RowApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ReactChildList } from "./ReactChildList";
import { mapJustify, mapAlign } from "../utils";

export const ReactRow = createReactComponent(
  RowApi,
  ({ props, buildChild, context }) => {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "row", 
        justifyContent: mapJustify(props.justify), 
        alignItems: mapAlign(props.align),
        width: '100%',
        margin: 0,
        padding: 0
      }}>
        <ReactChildList childList={props.children} buildChild={buildChild} context={context} />
      </div>
    );
  }
);
