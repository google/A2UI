import React from "react";
import { createReactComponent } from "../../adapter";
import { AudioPlayerApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { getBaseLeafStyle } from "../utils";

export const ReactAudioPlayer = createReactComponent(
  AudioPlayerApi,
  ({ props }) => {
    const style: React.CSSProperties = {
      ...getBaseLeafStyle(),
      width: '100%'
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {props.description && <span style={{ fontSize: '12px', color: '#666' }}>{props.description}</span>}
        <audio src={props.url} controls style={style} />
      </div>
    );
  }
);
