import { useCallback } from 'react';
import { Checkbox as SemiCheckbox } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding, useBooleanBinding, useSetData } from '../../core/hooks';

export function Checkbox({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.CheckboxNode;
  const { label, value } = node.properties;

  const labelValue = useStringBinding(label, component, surfaceId);
  const checked = useBooleanBinding(value, component, surfaceId);
  const setData = useSetData(component, surfaceId);

  const handleChange = useCallback(
    (e: { target: { checked?: boolean } }) => {
      if (value && 'path' in value && value.path) {
        setData(value.path, e.target.checked ?? false);
      }
    },
    [value, setData]
  );

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
  };

  return (
    <SemiCheckbox
      data-id={component.id}
      checked={checked ?? false}
      onChange={handleChange}
      style={style}
    >
      {labelValue}
    </SemiCheckbox>
  );
}

