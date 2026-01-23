import { useState, useCallback, useEffect, useId, memo } from 'react';
import type { Types } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';

/**
 * CheckBox component - a boolean toggle with a label.
 *
 * Supports two-way data binding for the checked state.
 */
export const CheckBox = memo(function CheckBox({ node, surfaceId }: A2UIComponentProps<Types.CheckboxNode>) {
  const { theme, resolveString, resolveBoolean, setValue, getValue } = useA2UIComponent(
    node,
    surfaceId
  );
  const props = node.properties;
  const id = useId();

  const label = resolveString(props.label);
  const valuePath = props.value?.path;
  const initialChecked = resolveBoolean(props.value) ?? false;

  const [checked, setChecked] = useState(initialChecked);

  // Sync with external data model changes
  useEffect(() => {
    if (valuePath) {
      const externalValue = getValue(valuePath);
      if (externalValue !== null && Boolean(externalValue) !== checked) {
        setChecked(Boolean(externalValue));
      }
    }
  }, [valuePath, getValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.checked;
      setChecked(newValue);

      // Two-way binding: update data model
      if (valuePath) {
        setValue(valuePath, newValue);
      }
    },
    [valuePath, setValue]
  );

  // Use <section> container to match Lit renderer
  return (
    <section
      className={classMapToString(theme.components.CheckBox.container)}
      style={stylesToObject(theme.additionalStyles?.CheckBox)}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        className={classMapToString(theme.components.CheckBox.element)}
      />
      {label && (
        <label
          htmlFor={id}
          className={classMapToString(theme.components.CheckBox.label)}
        >
          {label}
        </label>
      )}
    </section>
  );
});

export default CheckBox;
