import React from "react";
import { createReactComponent } from "../../adapter";
import { SliderApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN } from "../utils";

export const ReactSlider = createReactComponent(
  SliderApi,
  ({ props }) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.setValue(Number(e.target.value));
    };

    const uniqueId = React.useId();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: LEAF_MARGIN, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {props.label && <label htmlFor={uniqueId} style={{ fontSize: '14px', fontWeight: 'bold' }}>{props.label}</label>}
          <span style={{ fontSize: '12px', color: '#666' }}>{props.value}</span>
        </div>
        <input 
          id={uniqueId}
          type="range" 
          min={props.min ?? 0} 
          max={props.max} 
          value={props.value ?? 0} 
          onChange={onChange}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>
    );
  }
);
