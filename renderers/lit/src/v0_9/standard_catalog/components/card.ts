import { html, TemplateResult } from 'lit';
import { CardComponent } from '@a2ui/web_core/v0_9';

export const litCard = new CardComponent<TemplateResult>(
    ({ child }) => html`
    <div class="a2ui-card">
      ${child}
    </div>
  `
);
