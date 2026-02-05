import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { DividerComponent } from '@a2ui/web_core/v0_9';

export const litDivider = new DividerComponent<TemplateResult>(
    (_props, context) => {
        const classes = context.surfaceContext.theme.components.Divider;
        return html`<hr class=${classMap(classes)} />`;
    }
);
