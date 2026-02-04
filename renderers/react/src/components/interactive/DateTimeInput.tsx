/**
 * A2UI DateTimeInput Component
 * Date and/or time picker input
 */

import { useState, useCallback } from 'react';
import { useA2UI, resolvePath } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';
import type { A2UIAction } from '../../types';

export const DateTimeInput: A2UIComponentFn = ({ spec }) => {
  const { dispatch, theme, data } = useA2UI();
  const initial = resolvePath(spec.value as string, data) || '';
  const [value, setValue] = useState(String(initial));
  const label = spec.label as string | undefined;
  const enableDate = spec.enableDate !== false;
  const enableTime = spec.enableTime !== false;
  const onChange = spec.onChange as A2UIAction | undefined;

  let inputType = 'datetime-local';
  if (enableDate && !enableTime) inputType = 'date';
  else if (!enableDate && enableTime) inputType = 'time';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      if (onChange) dispatch({ ...onChange, params: { ...onChange.params, value: v } });
    },
    [dispatch, onChange]
  );

  return (
    <div>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 4,
            ...theme.typography.caption,
            color: theme.colors.textSecondary,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={inputType}
        value={value}
        onChange={handleChange}
        style={{
          padding: `${theme.spacing(1)}px`,
          borderRadius: theme.borderRadius,
          border: `1px solid ${theme.colors.textSecondary}`,
        }}
      />
    </div>
  );
};

registerComponent('DateTimeInput', DateTimeInput);
