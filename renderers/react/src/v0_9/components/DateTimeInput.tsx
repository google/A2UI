import React, { memo, useCallback } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * DateTimeInput component — date and/or time input with value binding.
 */
export const DateTimeInput = memo(function DateTimeInput({
  props,
}: A2UIComponentProps) {
  const label = props.label?.value ?? '';
  const value = props.value?.value ?? '';
  const enableDate = props.enableDate?.value ?? false;
  const enableTime = props.enableTime?.value ?? false;
  const min = props.min?.value;
  const max = props.max?.value;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.value?.onUpdate(e.target.value);
    },
    [props.value],
  );

  let inputType = 'text';
  if (enableDate && enableTime) {
    inputType = 'datetime-local';
  } else if (enableDate) {
    inputType = 'date';
  } else if (enableTime) {
    inputType = 'time';
  }

  return (
    <div className="a2ui-datetime-input">
      {label && <label className="a2ui-datetime-input__label">{label}</label>}
      <input
        className="a2ui-datetime-input__input"
        type={inputType}
        value={value}
        min={min}
        max={max}
        onChange={handleChange}
      />
    </div>
  );
});
