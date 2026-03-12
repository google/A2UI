import React from "react";
import { createReactComponent } from "../../adapter";
import { CardApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { getBaseContainerStyle } from "../utils";

export const ReactCard = createReactComponent(
  CardApi,
  ({ props, buildChild }) => {
    const style: React.CSSProperties = {
      ...getBaseContainerStyle(),
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      width: '100%'
    };

    return (
      <div style={style}>
        {props.child ? buildChild(props.child) : null}
      </div>
    );
  }
);
