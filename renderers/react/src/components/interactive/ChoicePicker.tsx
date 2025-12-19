/**
 * A2UI ChoicePicker Component
 * Single or multiple selection from options
 */

import { useState, useCallback } from 'react';
import { useA2UI, resolvePath } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';
import type { A2UIAction, ChoiceOption } from '../../types';

export const ChoicePicker: A2UIComponentFn = ({ spec }) => {
  const { dispatch, theme, data } = useA2UI();
  const options = spec.options as ChoiceOption[];
  const hint = spec.usageHint as string;
  const isMulti = hint === 'multipleSelection';
  const initial = resolvePath(spec.value as string | string[], data);
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(initial) ? initial : initial ? [String(initial)] : []
  );
  const label = spec.label as string | undefined;
  const onChange = spec.onChange as A2UIAction | undefined;

  const handleChange = useCallback(
    (optVal: string) => {
      let newSel: string[];
      if (isMulti) {
        newSel = selected.includes(optVal)
          ? selected.filter((v) => v !== optVal)
          : [...selected, optVal];
      } else {
        newSel = [optVal];
      }
      setSelected(newSel);
      if (onChange)
        dispatch({
          ...onChange,
          params: { ...onChange.params, value: isMulti ? newSel : newSel[0] },
        });
    },
    [dispatch, onChange, isMulti, selected]
  );

  return (
    <div>
      {label && (
        <div
          style={{
            marginBottom: theme.spacing(1),
            ...theme.typography.caption,
            color: theme.colors.textSecondary,
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing(1),
              cursor: 'pointer',
              padding: `${theme.spacing(0.5)}px ${theme.spacing(1)}px`,
              borderRadius: theme.borderRadius / 2,
              background: selected.includes(opt.value)
                ? `${theme.colors.primary}20`
                : 'transparent',
            }}
          >
            <input
              type={isMulti ? 'checkbox' : 'radio'}
              name={(spec.id as string) || 'choice'}
              checked={selected.includes(opt.value)}
              onChange={() => handleChange(opt.value)}
              style={{ accentColor: theme.colors.primary }}
            />
            <span style={theme.typography.body}>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

registerComponent('ChoicePicker', ChoicePicker);
