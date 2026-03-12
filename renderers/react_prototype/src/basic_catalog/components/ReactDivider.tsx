import React from "react";
import { createReactComponent } from "../../adapter";
import { DividerApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN } from "../utils";

export const ReactDivider = createReactComponent(
  DividerApi,
  ({ props }) => {
    const isVertical = props.axis === 'vertical';
    const style: React.CSSProperties = {
      margin: LEAF_MARGIN,
      border: 'none',
      backgroundColor: '#ccc'
    };

    if (isVertical) {
      style.width = '1px';
      style.height = '100%';
    } else {
      style.width = '100%';
      style.height = '1px';
    }

    return <div style={style} />;
  }
);
