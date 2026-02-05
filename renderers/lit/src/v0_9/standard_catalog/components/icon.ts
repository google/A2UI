import { html, TemplateResult } from 'lit';
import { IconComponent } from '@a2ui/web_core/v0_9';

export const litIcon = new IconComponent<TemplateResult>(
    ({ name }) => {
        if (typeof name === 'string') {
            return html`<i class="material-icons">${name}</i>`;
        }
        if (name && typeof name === 'object') {
            if ('icon' in name) {
                 return html`<i class="material-icons">${name.icon}</i>`;
            }
            // Add SVG path support if needed, assuming 'path' property
            if ('path' in name) {
                return html`<svg viewBox="0 0 24 24"><path d="${name.path}" /></svg>`;
            }
        }
        return html``;
    }
);
