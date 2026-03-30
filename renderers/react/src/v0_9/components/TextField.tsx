import React, { memo, useCallback } from 'react';
import type { A2UIComponentProps } from '../core/types.js';

/**
 * TextField component — input with label, variant, and two-way value binding.
 */
export const TextField = memo(function TextField({
  props,
}: A2UIComponentProps) {
  const label = props.label?.value ?? '';
  const value = props.value?.value ?? '';
  const variant = props.variant?.value ?? 'shortText';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      props.value?.onUpdate(e.target.value);
    },
    [props.value],
  );

  const variantToType: Record<string, string> = {
    shortText: 'text',
    number: 'number',
    obscured: 'password',
  };

  return (
    <div className={`a2ui-text-field a2ui-text-field--${variant}`}>
      {label && <label className="a2ui-text-field__label">{label}</label>}
      {variant === 'longText' ? (
        <textarea
          className="a2ui-text-field__input"
          value={value}
          onChange={handleChange}
        />
      ) : (
        <input
          className="a2ui-text-field__input"
          type={variantToType[variant] ?? 'text'}
          value={value}
          onChange={handleChange}
        />
      )}
    </div>
  );
});
