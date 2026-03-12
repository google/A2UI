import React from "react";
import { createReactComponent } from "../../adapter";
import { VideoApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { getBaseLeafStyle } from "../utils";

export const ReactVideo = createReactComponent(
  VideoApi,
  ({ props }) => {
    const style: React.CSSProperties = {
      ...getBaseLeafStyle(),
      width: '100%',
      aspectRatio: '16/9'
    };

    return (
      <video src={props.url} controls style={style} />
    );
  }
);
