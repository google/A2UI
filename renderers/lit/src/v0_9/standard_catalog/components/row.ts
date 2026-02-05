
import { html, TemplateResult } from 'lit';
import { RowComponent } from '@a2ui/web_core/v0_9';

export const litRow = new RowComponent<TemplateResult>(
    ({ children }) => html`
    <div style="display: flex; flex-direction: row;">
      ${children}
    </div>
  `
);
