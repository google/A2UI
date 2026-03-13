import React from "react";
import { createReactComponent } from "../../adapter";
import { CheckBoxApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN } from "../utils";

export const ReactCheckBox = createReactComponent(
  CheckBoxApi,
  ({ props, context }) => {
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.setValue('value', e.target.checked);
    };

    const id = `checkbox-${context.componentModel.id}`;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: LEAF_MARGIN }}>
        <input 
          id={id}
          type="checkbox" 
          checked={!!props.value} 
          onChange={onChange}
          style={{ cursor: 'pointer' }}
        />
        {props.label && <label htmlFor={id} style={{ cursor: 'pointer' }}>{props.label}</label>}
      </div>
    );
  }
);
