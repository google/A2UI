import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ListComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litList = new ListComponent<TemplateResult>(
  ({ children, direction, weight }, context) => {
    const classes = context.surfaceContext.theme.components.List;
    const a11y = getAccessibilityAttributes(context);
    
    const styles: Record<string, string> = {};
    if (direction === 'horizontal') {
      styles['display'] = 'flex';
      styles['flex-direction'] = 'row';
      styles['overflow-x'] = 'auto';
    } else {
      styles['display'] = 'flex';
      styles['flex-direction'] = 'column';
    }
    if (weight !== undefined) {
        styles['flex-grow'] = String(weight);
    }

    return html`
            <div class=${classMap(classes)} style=${styleMap(styles)} aria-label=${a11y['aria-label'] || null} aria-description=${a11y['aria-description'] || null}>
                ${children}
            </div>
        `;
  }
);
