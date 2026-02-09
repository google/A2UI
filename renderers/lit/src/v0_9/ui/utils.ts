import { ComponentContext } from '@a2ui/web_core/v0_9';
import { StyleInfo } from 'lit/directives/style-map.js';

export function getStyleMap(context: ComponentContext<unknown>, componentName: string, variant?: string): StyleInfo {
  const theme = context.surfaceContext.theme;
  const styles = theme.additionalStyles?.[componentName];

  if (!styles) {
    return {};
  }
  
  if (variant && typeof styles[variant] === 'object') {
     // It's a structured object like Text headers
     return (styles as any)[variant] || {};
  }

  // Otherwise it's a direct record of styles (like Button or Card)
  return styles as StyleInfo;
}

export function getAccessibilityAttributes(context: ComponentContext<unknown>) {
  const { label, description } = context.accessibility;
  return {
    'aria-label': label,
    'aria-description': description,
  };
}
