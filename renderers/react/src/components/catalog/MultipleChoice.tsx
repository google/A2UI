import { useCallback, useMemo } from 'react';
import { Select, RadioGroup, Radio, CheckboxGroup, Checkbox } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding, useSetData } from '../../core/hooks';

export function MultipleChoice({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.MultipleChoiceNode;
  const { selections, options = [], maxAllowedSelections } = node.properties;

  // Use string binding and handle array values internally
  const selectedValue = useStringBinding(selections, component, surfaceId);
  const setData = useSetData(component, surfaceId);

  const isMultiple = maxAllowedSelections !== 1;

  // Convert to array for multi-select handling
  const selectedValues = useMemo(() => {
    if (!selectedValue) return [];
    // Handle comma-separated values for multi-select
    return selectedValue.split(',').filter(Boolean);
  }, [selectedValue]);

  const handleChange = useCallback(
    (value: string | string[]) => {
      if (selections && 'path' in selections && selections.path) {
        // Store array as comma-separated string
        const stringValue = Array.isArray(value) ? value.join(',') : value;
        setData(selections.path, stringValue);
      }
    },
    [selections, setData]
  );

  const optionItems = useMemo(() => {
    return options.map((opt) => ({
      label: opt.label?.literalString ?? opt.value,
      value: opt.value,
    }));
  }, [options]);

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    width: '100%',
  };

  // Multiple selection with Select
  if (isMultiple && optionItems.length > 5) {
    return (
      <Select
        data-id={component.id}
        multiple
        value={selectedValues}
        onChange={(value) => handleChange(value as string[])}
        style={style}
      >
        {optionItems.map((opt) => (
          <Select.Option key={opt.value} value={opt.value}>
            {opt.label}
          </Select.Option>
        ))}
      </Select>
    );
  }

  // Multiple selection with CheckboxGroup
  if (isMultiple) {
    return (
      <CheckboxGroup
        data-id={component.id}
        value={selectedValues}
        onChange={(value) => handleChange(value as string[])}
        style={style}
      >
        {optionItems.map((opt) => (
          <Checkbox key={opt.value} value={opt.value}>
            {opt.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
    );
  }

  // Single selection with RadioGroup
  return (
    <RadioGroup
      data-id={component.id}
      value={selectedValues[0] ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      style={style}
    >
      {optionItems.map((opt) => (
        <Radio key={opt.value} value={opt.value}>
          {opt.label}
        </Radio>
      ))}
    </RadioGroup>
  );
}

