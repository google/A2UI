/**
 * A2UI Slider Component
 * Range input with min/max/step controls
 */

import { useState, useCallback } from 'react';
import { useA2UI, resolvePath } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';
import type { A2UIAction } from '../../types';

export const Slider: A2UIComponentFn = ({ spec }) => {
  const { dispatch, theme, data } = useA2UI();
  const min = (spec.min as number) ?? 0;
  const max = (spec.max as number) ?? 100;
  const step = (spec.step as number) || 1;
  const initial = resolvePath(spec.value as number, data);
  const [value, setValue] = useState(Number(initial) || min);
  const label = spec.label as string | undefined;
  const onChange = spec.onChange as A2UIAction | undefined;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      setValue(v);
      if (onChange) dispatch({ ...onChange, params: { ...onChange.params, value: v } });
    },
    [dispatch, onChange]
  );

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div
          style={{
            marginBottom: 4,
            ...theme.typography.caption,
            color: theme.colors.textSecondary,
          }}
        >
          {label}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        style={{ width: '100%', accentColor: theme.colors.primary }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
        }}
      >
        <span>{min}</span>
        <span style={{ fontWeight: 600, color: theme.colors.text }}>{value}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

registerComponent('Slider', Slider);
