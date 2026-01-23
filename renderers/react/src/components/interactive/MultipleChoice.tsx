import { useState, useCallback, useEffect, useId, memo } from 'react';
import type { Types, Primitives } from '@a2ui/lit/0.8';
import type { A2UIComponentProps } from '../../types';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { classMapToString, stylesToObject } from '../../lib/utils';

interface Option {
  label: Primitives.StringValue;
  value: string;
}

/**
 * MultipleChoice component - a selection component for single or multiple options.
 *
 * When maxAllowedSelections is 1, renders as radio buttons.
 * Otherwise, renders as checkboxes.
 */
export const MultipleChoice = memo(function MultipleChoice({
  node,
  surfaceId,
}: A2UIComponentProps<Types.MultipleChoiceNode>) {
  const { theme, resolveString, setValue, getValue } = useA2UIComponent(node, surfaceId);
  const props = node.properties;
  const groupId = useId();

  const options = (props.options as Option[]) ?? [];
  const maxSelections = props.maxAllowedSelections ?? 1;
  const selectionsPath = props.selections?.path;

  // Initialize selections from data model or literal
  const getInitialSelections = (): string[] => {
    if (selectionsPath) {
      const data = getValue(selectionsPath);
      if (Array.isArray(data)) return data.map(String);
      if (data !== null) return [String(data)];
    }
    return [];
  };

  const [selections, setSelections] = useState<string[]>(getInitialSelections);

  // Sync with external data model changes
  useEffect(() => {
    if (selectionsPath) {
      const externalValue = getValue(selectionsPath);
      if (externalValue !== null) {
        const newSelections = Array.isArray(externalValue)
          ? externalValue.map(String)
          : [String(externalValue)];
        setSelections(newSelections);
      }
    }
  }, [selectionsPath, getValue]);

  const handleChange = useCallback(
    (optionValue: string, checked: boolean) => {
      let newSelections: string[];

      if (maxSelections === 1) {
        // Radio behavior
        newSelections = checked ? [optionValue] : [];
      } else {
        // Checkbox behavior
        if (checked) {
          newSelections = [...selections, optionValue].slice(0, maxSelections);
        } else {
          newSelections = selections.filter((v) => v !== optionValue);
        }
      }

      setSelections(newSelections);

      // Two-way binding: update data model
      if (selectionsPath) {
        setValue(
          selectionsPath,
          maxSelections === 1 ? newSelections[0] ?? '' : newSelections
        );
      }
    },
    [maxSelections, selections, selectionsPath, setValue]
  );

  const isRadio = maxSelections === 1;

  // Use <section> container to match Lit renderer
  return (
    <section
      className={classMapToString(theme.components.MultipleChoice.container)}
      style={stylesToObject(theme.additionalStyles?.MultipleChoice)}
      role={isRadio ? 'radiogroup' : 'group'}
    >
      {options.map((option, index) => {
        const label = resolveString(option.label);
        const optionId = `${groupId}-${index}`;
        const isSelected = selections.includes(option.value);

        return (
          <label
            key={option.value}
            className={classMapToString(theme.components.MultipleChoice.element)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}
          >
            <input
              type={isRadio ? 'radio' : 'checkbox'}
              id={optionId}
              name={groupId}
              value={option.value}
              checked={isSelected}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span className={classMapToString(theme.components.MultipleChoice.label)}>
              {label}
            </span>
          </label>
        );
      })}
    </section>
  );
});

export default MultipleChoice;
