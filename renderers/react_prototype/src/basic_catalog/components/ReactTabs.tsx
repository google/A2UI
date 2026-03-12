import { useState } from "react";
import { createReactComponent } from "../../adapter";
import { TabsApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { LEAF_MARGIN } from "../utils";

export const ReactTabs = createReactComponent(
  TabsApi,
  ({ props, buildChild }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const tabs = props.tabs || [];
    const activeTab = tabs[selectedIndex];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: LEAF_MARGIN }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '8px' }}>
          {tabs.map((tab: any, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                borderBottom: selectedIndex === i ? '2px solid var(--a2ui-primary-color, #007bff)' : 'none',
                fontWeight: selectedIndex === i ? 'bold' : 'normal',
                cursor: 'pointer',
                color: selectedIndex === i ? 'var(--a2ui-primary-color, #007bff)' : 'inherit'
              }}
            >
              {tab.title}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {activeTab ? buildChild(activeTab.child) : null}
        </div>
      </div>
    );
  }
);
