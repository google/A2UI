import React from "react";
import { createReactComponent } from "../../adapter";
import { TextApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { getBaseLeafStyle } from "../utils";

export const ReactText = createReactComponent(
  TextApi,
  ({ props }) => {
    const text = props.text ?? "";
    const style: React.CSSProperties = {
      ...getBaseLeafStyle(),
      display: 'inline-block'
    };

    switch (props.variant) {
      case "h1": return <h1 style={style}>{text}</h1>;
      case "h2": return <h2 style={style}>{text}</h2>;
      case "h3": return <h3 style={style}>{text}</h3>;
      case "h4": return <h4 style={style}>{text}</h4>;
      case "h5": return <h5 style={style}>{text}</h5>;
      case "caption": return <small style={{ ...style, color: '#666' }}>{text}</small>;
      case "body":
      default: return <span style={style}>{text}</span>;
    }
  }
);
