import React, { useCallback } from 'react';
import { Card } from '@douyinfe/semi-ui';
import { Types } from '@a2ui/react';
import { CatalogComponentProps, useAction } from '@a2ui/react';

export interface OrgChartNode {
  title: string;
  name: string;
}

interface OrgChartProperties {
  chain?: OrgChartNode[];
  action?: Types.Action;
}

/**
 * OrgChart - A custom component that displays an organizational hierarchy.
 * 
 * This demonstrates how to create custom components for A2UI React renderer.
 */
export function OrgChart({ surfaceId, component }: CatalogComponentProps) {
  const properties = component.properties as unknown as OrgChartProperties;
  const { chain = [], action } = properties;

  const handleAction = useAction(action ?? null, component, surfaceId);

  const handleNodeClick = useCallback(() => {
    if (!action) return;
    handleAction();
  }, [action, handleAction]);

  if (!chain || chain.length === 0) {
    return <div style={{ padding: 16, color: '#999' }}>No hierarchy data</div>;
  }

  return (
    <div
      data-id={component.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: 16,
      }}
    >
      {chain.map((node, index) => {
        const isLast = index === chain.length - 1;
        return (
          <React.Fragment key={index}>
            <div
              role="button"
              tabIndex={0}
              onClick={handleNodeClick}
              onKeyDown={(e) => e.key === 'Enter' && handleNodeClick()}
              style={{ cursor: 'pointer' }}
            >
              <Card
                style={{
                  minWidth: 200,
                  textAlign: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: isLast ? '2px solid var(--semi-color-primary)' : undefined,
                  background: isLast ? 'var(--semi-color-primary-light-default)' : undefined,
                }}
                bodyStyle={{ padding: '12px 24px' }}
              >
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--semi-color-text-2)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  {node.title}
                </div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    color: 'var(--semi-color-text-0)',
                  }}
                >
                  {node.name}
                </div>
              </Card>
            </div>
            {!isLast && (
              <div style={{ color: 'var(--semi-color-text-3)', fontSize: 24 }}>↓</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

