import { html, TemplateResult } from 'lit';
import { ContainerComponent } from '@a2ui/web_core/v0_9';

export const litColumn = new ContainerComponent<TemplateResult>(
    'Column',
    'column',
    ({ children }) => html`
    <div style="display: flex; flex-direction: column;">
      ${children}
    </div>
  `
);

export const litRow = new ContainerComponent<TemplateResult>(
    'Row',
    'row',
    ({ children }) => html`
    <div style="display: flex; flex-direction: row;">
      ${children}
    </div>
  `
);
