import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { IconComponent } from '@a2ui/web_core/v0_9';

export const litIcon = new IconComponent<TemplateResult>(
    ({ name }, context) => {
        const classes = context.surfaceContext.theme.components.Icon;
        if (typeof name === 'string') {
            return html`<i class=${classMap(classes)}>${name}</i>`;
        }
        if (name && typeof name === 'object') {
            if ('icon' in name) {
                return html`<i class=${classMap(classes)}>${name.icon}</i>`;
            }
            // Add SVG path support if needed, assuming 'path' property
            if ('path' in name) {
                return html`<svg class=${classMap(classes)} viewBox="0 0 24 24"><path d="${name.path}" /></svg>`;
            }
        }
        return html``;
    }
);
