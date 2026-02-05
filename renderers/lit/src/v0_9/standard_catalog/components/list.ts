import { html, TemplateResult } from 'lit';
import { ListComponent } from '@a2ui/web_core/v0_9';

export const litList = new ListComponent<TemplateResult>(
  ({ children, direction }) => {
    const style = direction === 'horizontal'
      ? 'display: flex; flex-direction: row; overflow-x: auto;'
      : 'display: flex; flex-direction: column;';
    return html`
            <div class="a2ui-list" style="${style}">
                ${children}
            </div>
        `;
  }
);
