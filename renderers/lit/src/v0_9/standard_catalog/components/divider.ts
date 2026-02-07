import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DividerComponent } from '@a2ui/web_core/v0_9';

export const litDivider = new DividerComponent<TemplateResult>(
    ({ weight }, context) => {
        const classes = context.surfaceContext.theme.components.Divider;
        const styles: Record<string, string> = {};
        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }
        return html`<hr class=${classMap(classes)} style=${styleMap(styles)} />`;
    }
);
