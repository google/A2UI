import { html, TemplateResult } from 'lit';
import { ImageComponent } from '@a2ui/web_core/v0_9';

export const litImage = new ImageComponent<TemplateResult>(
    ({ url, fit, variant }) => {
        // Map 'fit' to object-fit CSS property
        const styleMap = {
            'contain': 'object-fit: contain;',
            'cover': 'object-fit: cover;',
            'fill': 'object-fit: fill;',
            'none': 'object-fit: none;',
            'scale-down': 'object-fit: scale-down;',
        };
        const style = fit ? styleMap[fit] : '';
        const className = variant ? `a2ui-image-${variant}` : 'a2ui-image';
        
        return html`<img src="${url}" style="${style}" class="${className}" alt="" />`;
    }
);
