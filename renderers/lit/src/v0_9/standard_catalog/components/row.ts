
import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { RowComponent } from '@a2ui/web_core/v0_9';

export const litRow = new RowComponent<TemplateResult>(
  ({ children, justify, align }, context) => {
    const classes = context.surfaceContext.theme.components.Row;

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

    return html`
    <div class=${classMap({ ...classes, ...alignClasses })} style="display: flex; flex-direction: row;">
      ${children}
    </div>
  `;
  }
);
