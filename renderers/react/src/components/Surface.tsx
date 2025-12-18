import { useSurface } from '../core/hooks';
import { Renderer } from './Renderer';

export interface SurfaceProps {
  surfaceId: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Surface component that renders an A2UI surface by its ID.
 */
export function Surface({ surfaceId, className, style }: SurfaceProps) {
  const surface = useSurface(surfaceId);

  if (!surface || !surface.componentTree) {
    return null;
  }

  const surfaceStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
    maxHeight: '100%',
    ...style,
  };

  return (
    <div className={className} style={surfaceStyles}>
      {surface.styles?.logoUrl && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img
            src={surface.styles.logoUrl}
            alt="Logo"
            style={{ width: '50%', maxWidth: '220px' }}
          />
        </div>
      )}
      <Renderer
        surfaceId={surfaceId}
        component={surface.componentTree}
      />
    </div>
  );
}

