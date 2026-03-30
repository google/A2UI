import React, { memo, useCallback } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * CheckBox component — checkbox with label and two-way boolean binding.
 */
export const CheckBox = memo(function CheckBox({
  props,
}: A2UIComponentProps) {
  const label = props.label?.value ?? '';
  const value = props.value?.value ?? false;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.value?.onUpdate(e.target.checked);
    },
    [props.value],
  );

  return (
    <label className="a2ui-checkbox">
      <input
        className="a2ui-checkbox__input"
        type="checkbox"
        checked={!!value}
        onChange={handleChange}
      />
      <span className="a2ui-checkbox__label">{label}</span>
    </label>
  );
});
