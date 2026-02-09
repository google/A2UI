
import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { RowComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litRow = new RowComponent<TemplateResult>(
  ({ children, justify, align, weight }, context) => {
    const classes = context.surfaceContext.theme.components.Row;
    const a11y = getAccessibilityAttributes(context);

    // Map justify/align
    const alignClasses: Record<string, boolean> = {};
    if (justify) {
      const map: Record<string, string> = { 'start': 'layout-sp-s', 'center': 'layout-sp-c', 'end': 'layout-sp-e', 'between': 'layout-sp-bt', 'evenly': 'layout-sp-ev', 'around': 'layout-sp-ev' }; // approximate
      if (map[justify]) alignClasses[map[justify]] = true;
    }
    if (align) {
      const map: Record<string, string> = { 'start': 'layout-al-fs', 'center': 'layout-al-c', 'end': 'layout-al-fe', 'stretch': 'layout-al-st' };
      if (map[align]) alignClasses[map[align]] = true;
    }

    const styles: Record<string, string> = {
      display: 'flex',
      'flex-direction': 'row',
    };
    if (weight !== undefined) {
        styles['flex-grow'] = String(weight);
    }

    return html`
    <div class=${classMap({ ...classes, ...alignClasses })} style=${styleMap(styles)} aria-label=${a11y['aria-label'] || null} aria-description=${a11y['aria-description'] || null}>
      ${children}
    </div>
  `;
  }
);
