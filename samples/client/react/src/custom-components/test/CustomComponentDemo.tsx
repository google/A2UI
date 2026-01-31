import { useState, useMemo, useEffect } from 'react';
import { Button, Card } from '@douyinfe/semi-ui';
import { IconSun, IconMoon } from '@douyinfe/semi-icons';
import { ThemeProvider, A2UIProvider, MessageProcessor } from '@a2ui/react';
import { OrgChart, OrgChartNode } from '../OrgChart';
import { ThemeMode, applyThemeMode, saveThemeMode, getInitialThemeMode } from '../../theme';

// Mock component data for testing
const mockOrgChartComponent = {
  id: 'test-org-chart',
  type: 'OrgChart',
  properties: {
    chain: [
      { title: 'CEO', name: 'Alice Johnson' },
      { title: 'SVP', name: 'Bob Smith' },
      { title: 'VP', name: 'Charlie Brown' },
      { title: 'Director', name: 'Diana Prince' },
      { title: 'Software Engineer', name: 'Evan Wright' },
    ] as OrgChartNode[],
    action: {
      name: 'showContactCard',
      context: [],
    },
  },
};

/**
 * Demo page for testing custom components and theming.
 */
export function CustomComponentDemo() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const processor = useMemo(() => new MessageProcessor(), []);

  const isDark = themeMode === 'dark';

  // Apply theme mode on mount and when it changes
  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(next);
    applyThemeMode(next);
    saveThemeMode(next);
  };

  // Mock surfaceId for testing
  const surfaceId = 'test-surface';

  return (
    <A2UIProvider processor={processor}>
    <ThemeProvider mode={themeMode}>
      <div style={{ padding: 24, minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, color: 'var(--semi-color-text-0)' }}>
            Custom Component Demo
          </h1>
          <Button
            theme="borderless"
            icon={isDark ? <IconSun size="large" /> : <IconMoon size="large" />}
            onClick={toggleTheme}
          />
        </div>

        {/* Theme Info */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Theme Provider</h3>
          <p>Current theme mode: <strong>{themeMode}</strong></p>
          <p>
            The ThemeProvider wraps the app and provides theme context.
            Click the sun/moon button to toggle between light and dark themes.
          </p>
          <p>Theme preference is saved to localStorage.</p>
        </Card>

        {/* OrgChart Demo */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>OrgChart Custom Component</h3>
          <p>
            This is a custom component registered via <code>registerComponent('OrgChart', OrgChart)</code>.
            When the server sends a component with <code>type: "OrgChart"</code>, this component will be rendered.
          </p>
          
          <div style={{ 
            background: 'var(--semi-color-fill-0)', 
            borderRadius: 8, 
            padding: 16,
            marginTop: 16 
          }}>
            <OrgChart
              surfaceId={surfaceId}
              component={mockOrgChartComponent as any}
            />
          </div>
        </Card>

        {/* Usage Instructions */}
        <Card style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>How to Use Custom Components</h3>
          <ol style={{ paddingLeft: 20 }}>
            <li>Create your component in <code>src/custom-components/</code></li>
            <li>Register it in <code>src/custom-components/index.ts</code></li>
            <li>Call <code>registerCustomComponents()</code> at app startup</li>
            <li>The server can now send components with your custom type</li>
          </ol>
          
          <h4>Server Message Example:</h4>
          <pre style={{ 
            background: 'var(--semi-color-fill-1)', 
            padding: 16, 
            borderRadius: 8,
            overflow: 'auto' 
          }}>
{JSON.stringify({
  surfaceUpdate: {
    surfaceId: 'main',
    components: [{
      id: 'org-1',
      component: {
        type: 'OrgChart',
        properties: {
          chain: [
            { title: 'CEO', name: 'Alice Johnson' },
            { title: 'Director', name: 'Bob Smith' }
          ]
        }
      }
    }]
  }
}, null, 2)}
          </pre>
        </Card>
      </div>
    </ThemeProvider>
    </A2UIProvider>
  );
}

export default CustomComponentDemo;

