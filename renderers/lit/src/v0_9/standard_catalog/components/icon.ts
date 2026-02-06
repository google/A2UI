import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { IconComponent } from '@a2ui/web_core/v0_9';

export const litIcon = new IconComponent<TemplateResult>(
    ({ name, weight }, context) => {
        const classes = context.surfaceContext.theme.components.Icon;
        const styles: Record<string, string> = {};
        
        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }

        if (typeof name === 'string') {
            return html`<span class="g-icon ${name}" style=${styleMap(styles)}>${name}</span>`;
        }
        if (name && typeof name === 'object') {
            if ('icon' in name) {
                return html`<span class="g-icon ${name.icon}" style=${styleMap(styles)}>${name.icon}</span>`;
            }
            // Add SVG path support if needed, assuming 'path' property
            if ('path' in name) {
                // For SVG, apply weight to a wrapper or the SVG itself if it's block/flex item
                return html`<svg class=${classMap(classes)} style=${styleMap(styles)} viewBox="0 0 24 24"><path d="${name.path}" /></svg>`;
            }
        }
        return html``;
    }
);
