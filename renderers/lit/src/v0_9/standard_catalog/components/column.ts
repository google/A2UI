
import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ColumnComponent } from '@a2ui/web_core/v0_9';

export const litColumn = new ColumnComponent<TemplateResult>(
  ({ children, justify, align }, context) => {
    const classes = context.surfaceContext.theme.components.Column;

    // Map justify/align
    const alignClasses: Record<string, boolean> = {};
    if (justify) {
      // For Column, justify is vertical (main axis)
      const map: Record<string, string> = { 'start': 'layout-sp-s', 'center': 'layout-sp-c', 'end': 'layout-sp-e', 'between': 'layout-sp-bt', 'evenly': 'layout-sp-ev' };
      if (map[justify]) alignClasses[map[justify]] = true;
    }
    if (align) {
      // For Column, align is horizontal (cross axis)
      const map: Record<string, string> = { 'start': 'layout-al-fs', 'center': 'layout-al-c', 'end': 'layout-al-fe', 'stretch': 'layout-al-st' };
      if (map[align]) alignClasses[map[align]] = true;
    }

    return html`
    <div class=${classMap({ ...classes, ...alignClasses })} style="display: flex; flex-direction: column;">
      ${children}
    </div>
  `;
  }
);
