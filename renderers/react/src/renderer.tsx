/**
 * A2UI Renderer - Core recursive component renderer
 */

import type { ComponentType, CSSProperties, ReactElement } from 'react';
import type { A2UIComponentSpec, A2UIAction, A2UITheme } from './types';
import { A2UIProvider, useA2UI, themeToCSSVars } from './context';

// =============================================================================
// COMPONENT REGISTRY
// =============================================================================

export type A2UIComponentFn = ComponentType<{ spec: A2UIComponentSpec }>;

const componentRegistry = new Map<string, A2UIComponentFn>();

export function registerComponent(type: string, component: A2UIComponentFn): void {
  componentRegistry.set(type, component);
}

export function getComponent(type: string): A2UIComponentFn | undefined {
  return componentRegistry.get(type);
}

// =============================================================================
// RENDERER
// =============================================================================

export function A2UIRenderer({ spec }: { spec: A2UIComponentSpec }): ReactElement | null {
  const Component = componentRegistry.get(spec.component);

  if (!Component) {
    console.warn(`[A2UI] Unknown component: ${spec.component}`);
    return (
      <div style={{ color: '#d32f2f', background: '#ffebee', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
        Unknown: {spec.component}
      </div>
    );
  }

  return <Component spec={spec} />;
}

export function renderChildren(children?: A2UIComponentSpec[]): ReactElement[] | null {
  if (!children?.length) return null;
  return children.map((child, i) => <A2UIRenderer key={child.id || `c-${i}`} spec={child} />);
}

export function renderChild(child?: A2UIComponentSpec): ReactElement | null {
  if (!child) return null;
  return <A2UIRenderer spec={child} />;
}

// =============================================================================
// ROOT
// =============================================================================

interface A2UIRootProps {
  spec: A2UIComponentSpec;
  data?: Record<string, unknown>;
  theme?: Partial<A2UITheme>;
  mode?: 'light' | 'dark';
  onAction?: (action: A2UIAction) => void;
  className?: string;
  style?: CSSProperties;
}

function A2UIRootInner({ spec, className, style }: { spec: A2UIComponentSpec; className?: string; style?: CSSProperties }): ReactElement {
  const { theme } = useA2UI();
  const cssVars = themeToCSSVars(theme);

  return (
    <div
      className={`a2ui-root ${className || ''}`}
      style={{
        ...cssVars,
        fontFamily: theme.font,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
        ...style,
      }}
    >
      <A2UIRenderer spec={spec} />
    </div>
  );
}

export function A2UIRoot({ spec, data, theme, mode = 'light', onAction, className, style }: A2UIRootProps): ReactElement {
  return (
    <A2UIProvider data={data} theme={theme} mode={mode} onAction={onAction}>
      <A2UIRootInner spec={spec} className={className} style={style} />
    </A2UIProvider>
  );
}
