import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ImageComponent } from '@a2ui/web_core/v0_9';

export const litImage = new ImageComponent<TemplateResult>(
    ({ url, fit, variant }, context) => {
        // Map 'fit' to object-fit CSS property
        const styleMap = {
            'contain': 'object-fit: contain;',
            'cover': 'object-fit: cover;',
            'fill': 'object-fit: fill;',
            'none': 'object-fit: none;',
            'scale-down': 'object-fit: scale-down;',
        };
        const style = fit ? styleMap[fit] : '';

        const theme = context.surfaceContext.theme.components.Image;
        const variantStyles = variant ? theme[variant] : {};
        const classes = { ...theme.all, ...variantStyles };
        
        // Wrap in div to support layout-el-cv and border-radius
        return html`
            <div class=${classMap(classes)}>
                <img src="${url}" style="${style}" alt="" />
            </div>
        `;
    }
);
