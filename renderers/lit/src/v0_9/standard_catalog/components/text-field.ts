import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { TextFieldComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litTextField = new TextFieldComponent<TemplateResult>(
    ({ label, value, variant, onChange, weight }, context) => {
        const classes = context.surfaceContext.theme.components.TextField;
        const a11y = getAccessibilityAttributes(context);
        const type = variant === 'number' ? 'number' : 
                     variant === 'obscured' ? 'password' : 'text';
        
        const styles: Record<string, string> = {};
        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }

        return html`
            <div class=${classMap(classes)} style=${styleMap(styles)}>
                <label>${label}</label>
                <input 
                    type="${type}" 
                    .value="${value}" 
                    @input="${(e: Event) => onChange((e.target as HTMLInputElement).value)}"
                    aria-label=${a11y['aria-label'] || label}
                    aria-description=${a11y['aria-description'] || null}
                />
            </div>
        `;
    }
);
