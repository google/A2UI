import { Image as SemiImage } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/lit/0.8';
import { CatalogComponentProps } from './index';
import { useStringBinding } from '../../core/hooks';

export function Image({ surfaceId, component }: CatalogComponentProps) {
  const node = component as Types.ImageNode;
  const { url, usageHint } = node.properties;

  const imageUrl = useStringBinding(url, component, surfaceId);

  if (!imageUrl) {
    return null;
  }

  // 根据 usageHint 设置不同的尺寸
  const getSize = () => {
    switch (usageHint) {
      case 'icon':
        return { width: 24, height: 24 };
      case 'avatar':
        return { width: 64, height: 64 };
      case 'smallFeature':
        return { width: 80, height: 80 };
      case 'mediumFeature':
        return { width: 100, height: 100 };
      case 'largeFeature':
        return { width: 160, height: 120 };
      case 'header':
        return { width: '100%', height: 180 };
      default:
        // 默认尺寸适合卡片内的图片
        return { width: 100, height: 100 };
    }
  };

  const size = getSize();

  const containerStyle: React.CSSProperties = {
    flex: component.weight ?? 'initial',
    flexShrink: 0,
    width: size.width,
    height: size.height,
    borderRadius: usageHint === 'avatar' ? '50%' : '12px',
    overflow: 'hidden',
  };


  return (
    <div data-id={component.id} style={containerStyle}>
      <SemiImage
        src={imageUrl}
        width={"100%"}
        height={"100%"}
        preview={true}
      />
    </div>
  );
}
