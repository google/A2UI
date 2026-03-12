import React from "react";
import { createReactComponent } from "../../adapter";
import { ListApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ReactChildList } from "./ReactChildList";
import { mapAlign } from "../utils";

export const ReactList = createReactComponent(
  ListApi,
  ({ props, buildChild, context }) => {
    const isHorizontal = props.direction === 'horizontal';
    const style: React.CSSProperties = {
      display: "flex",
      flexDirection: isHorizontal ? "row" : "column",
      alignItems: mapAlign(props.align),
      overflowX: isHorizontal ? "auto" : "hidden",
      overflowY: isHorizontal ? "hidden" : "auto",
      width: '100%',
      margin: 0,
      padding: 0
    };

    return (
      <div style={style}>
        <ReactChildList childList={props.children} buildChild={buildChild} context={context} />
      </div>
    );
  }
);
