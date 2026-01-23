import { useState, useCallback, useEffect, useId, memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';

/**
 * DateTimeInput component - a date and/or time picker.
 *
 * Supports enabling date, time, or both. Uses native HTML5 date/time inputs.
 */
export const DateTimeInput = memo(function DateTimeInput({ node, surfaceId }: A2UIComponentProps<Types.DateTimeInputNode>) {
  const { theme, resolveString, setValue, getValue } = useA2UIComponent(node, surfaceId);
  const props = node.properties;
  const id = useId();

  const valuePath = props.value?.path;
  const initialValue = resolveString(props.value) ?? '';
  const enableDate = props.enableDate ?? true;
  const enableTime = props.enableTime ?? false;

  const [value, setLocalValue] = useState(initialValue);

  // Sync with external data model changes
  useEffect(() => {
    if (valuePath) {
      const externalValue = getValue(valuePath);
      if (externalValue !== null && String(externalValue) !== value) {
        setLocalValue(String(externalValue));
      }
    }
  }, [valuePath, getValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Two-way binding: update data model
      if (valuePath) {
        setValue(valuePath, newValue);
      }
    },
    [valuePath, setValue]
  );

  // Determine input type based on enableDate and enableTime
  let inputType: 'date' | 'time' | 'datetime-local' = 'date';
  if (enableDate && enableTime) {
    inputType = 'datetime-local';
  } else if (enableTime && !enableDate) {
    inputType = 'time';
  }

  // Use <section> container to match Lit renderer
  return (
    <section
      className={classMapToString(theme.components.DateTimeInput.container)}
      style={stylesToObject(theme.additionalStyles?.DateTimeInput)}
    >
      <input
        type={inputType}
        id={id}
        value={value}
        onChange={handleChange}
        className={classMapToString(theme.components.DateTimeInput.element)}
      />
    </section>
  );
});

export default DateTimeInput;
