import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { TextComponent } from '@a2ui/web_core/v0_9';
import { getStyleMap, getAccessibilityAttributes } from '../../ui/utils.js';

export const litText = new TextComponent<TemplateResult>(
    ({ text, variant, weight }, context) => {
        const theme = context.surfaceContext.theme.components.Text;
        const targetVariant = variant || 'body';
        // @ts-ignore - indexing might be flagged if variant is not strictly typed to keys
        const variantClasses = theme[targetVariant] || {};
        const classes = { ...theme.all, ...variantClasses };
        const styles = getStyleMap(context, 'Text', targetVariant);
        const a11y = getAccessibilityAttributes(context);

        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }

        return html`<span class=${classMap(classes)} style=${styleMap(styles)} aria-label=${a11y['aria-label'] || null} aria-description=${a11y['aria-description'] || null}>${text}</span>`;
    }
);
