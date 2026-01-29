import { useState, useCallback, useEffect, useId, memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';

/**
 * Slider component - a numeric value selector with a range.
 *
 * Supports two-way data binding for the value.
 */
export const Slider = memo(function Slider({ node, surfaceId }: A2UIComponentProps<Types.SliderNode>) {
  const { theme, resolveNumber, setValue, getValue } = useA2UIComponent(
    node,
    surfaceId
  );
  const props = node.properties;
  const id = useId();

  const valuePath = props.value?.path;
  const initialValue = resolveNumber(props.value) ?? 0;
  const minValue = props.minValue ?? 0;
  const maxValue = props.maxValue ?? 100;

  const [value, setLocalValue] = useState(initialValue);

  // Sync with external data model changes
  useEffect(() => {
    if (valuePath) {
      const externalValue = getValue(valuePath);
      if (externalValue !== null && Number(externalValue) !== value) {
        setLocalValue(Number(externalValue));
      }
    }
  }, [valuePath, getValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      setLocalValue(newValue);

      // Two-way binding: update data model
      if (valuePath) {
        setValue(valuePath, newValue);
      }
    },
    [valuePath, setValue]
  );

  // Access label from props if it exists (Lit component supports it but type doesn't define it)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labelValue = (props as any).label;
  const { resolveString } = useA2UIComponent(node, surfaceId);
  const label = labelValue ? resolveString(labelValue) : '';

  // Use <section> container to match Lit renderer structure:
  // <section><label>...</label><input/><span>value</span></section>
  return (
    <section
      className={classMapToString(theme.components.Slider.container)}
      style={stylesToObject(theme.additionalStyles?.Slider)}
    >
      <label
        htmlFor={id}
        className={classMapToString(theme.components.Slider.label)}
      >
        {label}
      </label>
      <input
        type="range"
        id={id}
        name="data"
        value={value}
        min={minValue}
        max={maxValue}
        onChange={handleChange}
        className={classMapToString(theme.components.Slider.element)}
      />
      <span className={classMapToString(theme.components.Slider.label)}>
        {value}
      </span>
    </section>
  );
});

export default Slider;
