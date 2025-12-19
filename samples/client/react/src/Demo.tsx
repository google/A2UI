/**
 * A2UI Demo Application
 * Interactive showcase of all A2UI components
 */

import { useState, useCallback } from 'react';
import { A2UIRoot, type A2UIAction, type A2UIComponentSpec } from '@a2ui/react';
import './demo.css';
import {
  flashcardSpec,
  flashcardData,
  dashboardSpec,
  dashboardData,
  formSpec,
  formData,
  tabsSpec,
  tabsData,
  modalSpec,
  showcaseSpec,
} from './examples';

type DemoName = 'flashcard' | 'dashboard' | 'form' | 'tabs' | 'modal' | 'showcase';

interface DemoConfig {
  spec: A2UIComponentSpec;
  data: Record<string, unknown>;
  description: string;
}

const demos: Record<DemoName, DemoConfig> = {
  flashcard: {
    spec: flashcardSpec,
    data: flashcardData,
    description: 'SRS flashcard with Japanese vocabulary',
  },
  dashboard: {
    spec: dashboardSpec,
    data: dashboardData,
    description: 'Stats dashboard with data-bound list',
  },
  form: {
    spec: formSpec,
    data: formData,
    description: 'Settings form with various input types',
  },
  tabs: {
    spec: tabsSpec,
    data: tabsData,
    description: 'Tabbed navigation combining all demos',
  },
  modal: {
    spec: modalSpec,
    data: {},
    description: 'Modal dialog with trigger button',
  },
  showcase: {
    spec: showcaseSpec,
    data: {},
    description: 'All components in one view',
  },
};

type ThemeMode = 'light' | 'dark';

export function Demo() {
  const [currentDemo, setCurrentDemo] = useState<DemoName>('showcase');
  const [actions, setActions] = useState<A2UIAction[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  const handleAction = useCallback((action: A2UIAction) => {
    console.log('[A2UI Action]', action);
    setActions((prev) => [...prev.slice(-9), action]);
  }, []);

  const { spec, data, description } = demos[currentDemo];

  return (
    <div className="demo-container">
      {/* Sidebar */}
      <aside className="demo-sidebar">
        <div className="demo-header">
          <h1>A2UI React</h1>
          <p className="demo-subtitle">Component Demo</p>
        </div>

        <nav className="demo-nav">
          {(Object.keys(demos) as DemoName[]).map((name) => (
            <button
              key={name}
              onClick={() => setCurrentDemo(name)}
              className={`demo-nav-item ${currentDemo === name ? 'active' : ''}`}
            >
              {name}
            </button>
          ))}
        </nav>

        <div className="demo-options">
          <label className="demo-checkbox">
            <input
              type="checkbox"
              checked={showJson}
              onChange={(e) => setShowJson(e.target.checked)}
            />
            Show JSON
          </label>
          <div className="demo-theme-toggle">
            <span className="demo-theme-label">Theme:</span>
            <button
              className={`demo-theme-btn ${themeMode === 'light' ? 'active' : ''}`}
              onClick={() => setThemeMode('light')}
            >
              ☀️ Light
            </button>
            <button
              className={`demo-theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => setThemeMode('dark')}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <div className="demo-description">
          <p>{description}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="demo-main">
        <div className="demo-render-area">
          <A2UIRoot spec={spec} data={data} mode={themeMode} onAction={handleAction} />
        </div>

        {/* Action Log */}
        <div className="demo-action-log">
          <div className="demo-action-log-header">Action Log</div>
          {actions.length === 0 ? (
            <div className="demo-action-log-empty">
              No actions yet. Interact with the UI above.
            </div>
          ) : (
            actions.map((action, i) => (
              <div key={i} className="demo-action-log-entry">
                <span className="action-type">{action.type}</span>
                {action.name && <span className="action-name">.{action.name}</span>}
                {action.params && (
                  <span className="action-params"> {JSON.stringify(action.params)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* JSON Panel */}
      {showJson && (
        <aside className="demo-json-panel">
          <div className="demo-json-section">
            <h3>Spec</h3>
            <pre>{JSON.stringify(spec, null, 2)}</pre>
          </div>
          {Object.keys(data).length > 0 && (
            <div className="demo-json-section">
              <h3>Data</h3>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

export default Demo;
