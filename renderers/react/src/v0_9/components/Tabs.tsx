import React, { memo, useState } from 'react';
import type { A2UIComponentProps } from '../core/types.js';
import { ComponentHost } from '../core/ComponentHost.js';
import { useA2UI } from '../core/A2UIProvider.js';

/**
 * Tabs component — tab navigation with switchable content panels.
 */
export const Tabs = memo(function Tabs({
  props,
  surfaceId,
  dataContextPath,
  registry,
}: A2UIComponentProps) {
  const { surfaceGroup } = useA2UI();
  const surface = surfaceGroup.getSurface(surfaceId);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = props.tabs?.value;

  if (!surface || !Array.isArray(tabs) || tabs.length === 0) return null;

  const safeIndex = Math.min(selectedIndex, tabs.length - 1);

  return (
    <div className="a2ui-tabs">
      <div className="a2ui-tabs__buttons" role="tablist">
        {tabs.map((tab: any, index: number) => (
          <button
            key={index}
            role="tab"
            className={`a2ui-tabs__tab ${index === safeIndex ? 'a2ui-tabs__tab--selected' : ''}`}
            aria-selected={index === safeIndex}
            disabled={index === safeIndex}
            onClick={() => setSelectedIndex(index)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="a2ui-tabs__content" role="tabpanel">
        {tabs[safeIndex]?.child && (
          <ComponentHost
            surface={surface}
            componentId={tabs[safeIndex].child}
            dataContextPath={dataContextPath}
            registry={registry}
          />
        )}
      </div>
    </div>
  );
});
