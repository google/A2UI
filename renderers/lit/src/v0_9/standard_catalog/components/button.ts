import { html, TemplateResult } from 'lit';
import { ButtonComponent } from '@a2ui/web_core/v0_9';

export const litButton = new ButtonComponent<TemplateResult>(
    ({ label, disabled, onAction }) => html`
    <button ?disabled=${disabled} @click=${onAction}>
      ${label}
    </button>
  `
);
