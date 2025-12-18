import { useCallback } from 'react';
import { DatePicker, TimePicker } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding, useSetData } from '../../core/hooks';

export function DateTimeInput({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.DateTimeInputNode;
  const { value, enableDate = true, enableTime = false } = node.properties;

  const dateValue = useStringBinding(value, component, surfaceId);
  const setData = useSetData(component, surfaceId);

  const handleChange = useCallback(
    (date: Date | Date[] | string | string[] | undefined) => {
      if (value && 'path' in value && value.path && date) {
        const dateStr = date instanceof Date
          ? date.toISOString()
          : Array.isArray(date)
            ? (date[0] instanceof Date ? date[0].toISOString() : date[0])
            : date;
        setData(value.path, dateStr);
      }
    },
    [value, setData]
  );

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    width: '100%',
  };

  const currentValue = dateValue ? new Date(dateValue) : undefined;

  // Date and Time
  if (enableDate && enableTime) {
    return (
      <div data-id={component.id}>
        <DatePicker
          type="dateTime"
          value={currentValue}
          onChange={handleChange}
          style={style}
        />
      </div>
    );
  }

  // Time only
  if (enableTime && !enableDate) {
    return (
      <div data-id={component.id}>
        <TimePicker
          value={currentValue}
          onChange={handleChange}
          style={style}
        />
      </div>
    );
  }

  // Date only (default)
  return (
    <div data-id={component.id}>
      <DatePicker
        type="date"
        value={currentValue}
        onChange={handleChange}
        style={style}
      />
    </div>
  );
}

