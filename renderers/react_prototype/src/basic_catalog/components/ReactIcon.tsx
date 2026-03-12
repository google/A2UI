import React from "react";
import { createReactComponent } from "../../adapter";
import { IconApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { getBaseLeafStyle } from "../utils";

export const ReactIcon = createReactComponent(
  IconApi,
  ({ props }) => {
    const iconName = typeof props.name === 'string' ? props.name : (props.name as any)?.path;
    const style: React.CSSProperties = {
      ...getBaseLeafStyle(),
      fontSize: '24px',
      width: '24px',
      height: '24px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    return (
      <span className="material-symbols-outlined" style={style}>
        {iconName}
      </span>
    );
  }
);
