import { useCallback } from 'react';
import { Slider as SemiSlider } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useNumberBinding, useSetData } from '../../core/hooks';

export function Slider({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.SliderNode;
  const { value, minValue = 0, maxValue = 100 } = node.properties;

  const currentValue = useNumberBinding(value, component, surfaceId);
  const setData = useSetData(component, surfaceId);

  const handleChange = useCallback(
    (val: number | number[] | undefined) => {
      if (value && 'path' in value && value.path && val !== undefined) {
        const numVal = Array.isArray(val) ? val[0] : val;
        setData(value.path, numVal);
      }
    },
    [value, setData]
  );

  const style: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    width: '100%',
  };

  return (
    <SemiSlider
      data-id={component.id}
      value={currentValue ?? minValue}
      min={minValue}
      max={maxValue}
      onChange={handleChange}
      style={style}
    />
  );
}

