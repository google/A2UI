import React from "react";
import { createReactComponent } from "../../adapter";
import { ImageApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { getBaseLeafStyle } from "../utils";

export const ReactImage = createReactComponent(
  ImageApi,
  ({ props }) => {
    const style: React.CSSProperties = {
      ...getBaseLeafStyle(),
      objectFit: props.fit as any,
      width: '100%',
      height: 'auto',
      display: 'block'
    };

    if (props.variant === 'icon') {
      style.width = '24px';
      style.height = '24px';
    } else if (props.variant === 'avatar') {
      style.width = '40px';
      style.height = '40px';
      style.borderRadius = '50%';
    } else if (props.variant === 'smallFeature') {
      style.maxWidth = '100px';
    } else if (props.variant === 'largeFeature') {
      style.maxHeight = '400px';
    } else if (props.variant === 'header') {
      style.height = '200px';
      style.objectFit = 'cover';
    }

    return <img src={props.url} alt="" style={style} />;
  }
);
