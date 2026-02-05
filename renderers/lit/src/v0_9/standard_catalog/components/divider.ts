import { html, TemplateResult } from 'lit';
import { DividerComponent } from '@a2ui/web_core/v0_9';

export const litDivider = new DividerComponent<TemplateResult>(
    () => html`<hr class="a2ui-divider" />`
);
