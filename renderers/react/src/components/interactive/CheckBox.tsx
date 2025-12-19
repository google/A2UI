/**
 * A2UI CheckBox Component
 * Boolean toggle with label
 */

import { useState, useCallback } from 'react';
import { useA2UI, resolvePath } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';
import type { A2UIAction } from '../../types';

export const CheckBox: A2UIComponentFn = ({ spec }) => {
  const { dispatch, theme, data } = useA2UI();
  const initial = resolvePath(spec.value as boolean, data);
  const label = resolvePath(spec.label as string, data);
  const [checked, setChecked] = useState(Boolean(initial));
  const onChange = spec.onChange as A2UIAction | undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.checked;
      setChecked(v);
      if (onChange) dispatch({ ...onChange, params: { ...onChange.params, value: v } });
    },
    [dispatch, onChange]
  );

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        style={{ accentColor: theme.colors.primary, width: 18, height: 18 }}
      />
      <span style={theme.typography.body}>{label}</span>
    </label>
  );
};

registerComponent('CheckBox', CheckBox);
