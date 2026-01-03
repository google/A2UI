import React, { useCallback } from 'react';
import { Input, InputNumber, TextArea } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding, useSetData } from '../../core/hooks';

export function TextField({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.TextFieldNode;
  const { text, label, type = 'shortText' } = node.properties;

  const textValue = useStringBinding(text ?? null, component, surfaceId);
  const labelValue = useStringBinding(label, component, surfaceId);
  const setData = useSetData(component, surfaceId);

  const handleChange = useCallback(
    (value: string | number) => {
      if (text && 'path' in text && text.path) {
        setData(text.path, String(value));
      }
    },
    [text, setData]
  );

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    width: '100%',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: component.weight ?? 'initial',
  };

  if (type === 'number') {
    return (
      <div id={component.id} style={containerStyle}>
        {labelValue && <label>{labelValue}</label>}
        <InputNumber
          value={textValue ? Number(textValue) : undefined}
          onChange={(value) => handleChange(value ?? 0)}
          style={style}
        />
      </div>
    );
  }

  if (type === 'longText') {
    return (
      <div id={component.id} style={containerStyle}>
        {labelValue && <label>{labelValue}</label>}
        <TextArea
          value={textValue ?? ''}
          onChange={(value) => handleChange(value)}
          style={style}
          autosize={{ minRows: 3, maxRows: 10 }}
        />
      </div>
    );
  }

  return (
    <div id={component.id} style={containerStyle}>
      {labelValue && <label>{labelValue}</label>}
      <Input
        value={textValue ?? ''}
        onChange={(value) => handleChange(value)}
        type={type === 'date' ? 'text' : 'text'}
        style={style}
      />
    </div>
  );
}

