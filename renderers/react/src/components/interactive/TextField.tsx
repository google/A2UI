/**
 * A2UI TextField Component
 * Text input with various usage hints (short, long, number, obscured)
 */

import { useState, useCallback, type CSSProperties } from 'react';
import { useA2UI, resolvePath } from '../../context';
import { registerComponent, type A2UIComponentFn } from '../../renderer';
import type { A2UIAction } from '../../types';

export const TextField: A2UIComponentFn = ({ spec }) => {
  const { dispatch, theme, data } = useA2UI();
  const initial = spec.text ? resolvePath(spec.text as string, data) : '';
  const [value, setValue] = useState(String(initial || ''));
  const label = spec.label as string | undefined;
  const hint = spec.usageHint as string | undefined;
  const onChange = spec.onChange as A2UIAction | undefined;
  const onSubmit = spec.onSubmit as A2UIAction | undefined;

  const inputType = hint === 'number' ? 'number' : hint === 'obscured' ? 'password' : 'text';
  const isLong = hint === 'longText';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setValue(v);
      if (onChange) dispatch({ ...onChange, params: { ...onChange.params, value: v } });
    },
    [dispatch, onChange]
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
        dispatch({ ...onSubmit, params: { ...onSubmit.params, value } });
      }
    },
    [dispatch, onSubmit, value]
  );

  const style: CSSProperties = {
    width: '100%',
    padding: `${theme.spacing(1)}px ${theme.spacing(1.5)}px`,
    borderRadius: theme.borderRadius,
    border: `1px solid ${theme.colors.textSecondary}`,
    ...theme.typography.body,
  };

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
      {isLong ? (
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          rows={4}
          style={{ ...style, resize: 'vertical' }}
        />
      ) : (
        <input
          type={inputType}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          style={style}
        />
      )}
    </div>
  );
};

registerComponent('TextField', TextField);
