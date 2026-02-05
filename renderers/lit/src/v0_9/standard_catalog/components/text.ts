import { html, TemplateResult } from 'lit';
import { TextComponent } from '@a2ui/web_core/v0_9';

export const litText = new TextComponent<TemplateResult>(
    ({ text }) => html`<span>${text}</span>`
);
