import React, { memo, useCallback } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * Slider component — range input with min, max, and value binding.
 */
export const Slider = memo(function Slider({
  props,
}: A2UIComponentProps) {
  const label = props.label?.value ?? '';
  const min = props.min?.value ?? 0;
  const max = props.max?.value ?? 100;
  const value = props.value?.value ?? min;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.value?.onUpdate(Number(e.target.value));
    },
    [props.value],
  );

  return (
    <div className="a2ui-slider">
      {label && <label className="a2ui-slider__label">{label}</label>}
      <input
        className="a2ui-slider__input"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
      />
      <span className="a2ui-slider__value">{value}</span>
    </div>
  );
});
