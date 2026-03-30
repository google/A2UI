import React, { memo, useCallback } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * ChoicePicker component — select one or more options from a list.
 */
export const ChoicePicker = memo(function ChoicePicker({
  props,
}: A2UIComponentProps) {
  const label = props.label?.value ?? '';
  const variant = props.variant?.value ?? 'mutuallyExclusive';
  const options: Array<{ label: string; value: string }> = props.options?.value ?? [];
  const selectedValues: string[] = props.value?.value ?? [];

  const handleChange = useCallback(
    (optionValue: string) => {
      if (variant === 'mutuallyExclusive') {
        props.value?.onUpdate([optionValue]);
      } else {
        const next = selectedValues.includes(optionValue)
          ? selectedValues.filter((v: string) => v !== optionValue)
          : [...selectedValues, optionValue];
        props.value?.onUpdate(next);
      }
    },
    [variant, selectedValues, props.value],
  );

  return (
    <fieldset className={`a2ui-choice-picker a2ui-choice-picker--${variant}`}>
      {label && <legend className="a2ui-choice-picker__label">{label}</legend>}
      {variant === 'mutuallyExclusive' ? (
        <select
          className="a2ui-choice-picker__select"
          value={selectedValues[0] ?? ''}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="" disabled>Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="a2ui-choice-picker__options">
          {options.map((opt) => (
            <label key={opt.value} className="a2ui-choice-picker__option">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.value)}
                onChange={() => handleChange(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
});
