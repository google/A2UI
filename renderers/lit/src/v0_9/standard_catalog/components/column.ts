
import { html, TemplateResult } from 'lit';
import { ColumnComponent } from '@a2ui/web_core/v0_9';

export const litColumn = new ColumnComponent<TemplateResult>(
    ({ children }) => html`
    <div style="display: flex; flex-direction: column;">
      ${children}
    </div>
  `
);
