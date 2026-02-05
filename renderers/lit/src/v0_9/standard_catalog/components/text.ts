import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { TextComponent } from '@a2ui/web_core/v0_9';
import { getStyleMap } from '../../ui/utils.js';

export const litText = new TextComponent<TemplateResult>(
    ({ text, variant }, context) => {
        const theme = context.surfaceContext.theme.components.Text;
        const targetVariant = variant || 'body';
        // @ts-ignore - indexing might be flagged if variant is not strictly typed to keys
        const variantClasses = theme[targetVariant] || {};
        const classes = { ...theme.all, ...variantClasses };
        const styles = getStyleMap(context, 'Text', targetVariant);

        return html`<span class=${classMap(classes)} style=${styleMap(styles)}>${text}</span>`;
    }
);
