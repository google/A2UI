import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ListComponent } from '@a2ui/web_core/v0_9';

export const litList = new ListComponent<TemplateResult>(
  ({ children, direction }, context) => {
    const classes = context.surfaceContext.theme.components.List;
    const style = direction === 'horizontal'
      ? 'display: flex; flex-direction: row; overflow-x: auto;'
      : 'display: flex; flex-direction: column;';
    return html`
            <div class=${classMap(classes)} style="${style}">
                ${children}
            </div>
        `;
  }
);
