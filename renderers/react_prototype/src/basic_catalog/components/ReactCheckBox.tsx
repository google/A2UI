import React from "react";
import { createReactComponent } from "../../adapter";
import { CheckBoxApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN } from "../utils";

export const ReactCheckBox = createReactComponent(
  CheckBoxApi,
  ({ props }) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.setValue?.(e.target.checked);
    };

    const uniqueId = React.useId();

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: LEAF_MARGIN }}>
        <input 
          id={uniqueId}
          type="checkbox" 
          checked={!!props.value} 
          onChange={onChange}
          style={{ cursor: 'pointer' }}
        />
        {props.label && <label htmlFor={uniqueId} style={{ cursor: 'pointer' }}>{props.label}</label>}
      </div>
    );
  }
);
