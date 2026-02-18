import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ImageComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litImage = new ImageComponent<TemplateResult>(
    ({ url, fit, variant, weight }, context) => {
        // Map 'fit' to object-fit CSS property
        const fitStyle = fit ? `object-fit: ${fit};` : '';

        const theme = context.surfaceContext.theme.components.Image;
        const variantStyles = variant ? theme[variant] : {};
        const classes = { ...theme.all, ...variantStyles };
        const a11y = getAccessibilityAttributes(context);
        
        const wrapperStyles: Record<string, string> = {};
        if (weight !== undefined) {
            wrapperStyles['flex-grow'] = String(weight);
        }

        // Wrap in div to support layout-el-cv and border-radius
        return html`
            <div class=${classMap(classes)} style=${styleMap(wrapperStyles)} aria-description=${a11y['aria-description'] || null}>
                <img src="${url}" style="${fitStyle}" alt="${a11y['aria-label'] || ''}" />
            </div>
        `;
    }
);
