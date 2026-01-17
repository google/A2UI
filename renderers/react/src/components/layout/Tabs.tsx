/**
 * A2UI Tabs Component
 * Tabbed navigation container
 */

import { useState } from 'react';
import { useA2UI } from '../../context';
import { registerComponent, renderChild, type A2UIComponentFn } from '../../renderer';
import type { A2UIComponentSpec } from '../../types';

interface TabItem {
  title: string;
  child: A2UIComponentSpec;
}

export const Tabs: A2UIComponentFn = ({ spec }) => {
  const { theme } = useA2UI();
  const tabItems = spec.tabItems as TabItem[];
  const [selected, setSelected] = useState((spec.selectedIndex as number) || 0);

  return (
    <div>
      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: `2px solid ${theme.colors.surface}`,
          marginBottom: theme.spacing(2),
        }}
      >
        {tabItems.map((tab, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            style={{
              padding: `${theme.spacing(1)}px ${theme.spacing(2)}px`,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              ...theme.typography.body,
              fontWeight: i === selected ? 600 : 400,
              color: i === selected ? theme.colors.primary : theme.colors.text,
              borderBottom: `2px solid ${i === selected ? theme.colors.primary : 'transparent'}`,
              marginBottom: -2,
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>{tabItems[selected]?.child && renderChild(tabItems[selected].child)}</div>
    </div>
  );
};

registerComponent('Tabs', Tabs);
