import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { TextFieldComponent } from '@a2ui/web_core/v0_9';

export const litTextField = new TextFieldComponent<TemplateResult>(
    ({ label, value, variant, onChange }, context) => {
        const classes = context.surfaceContext.theme.components.TextField;
        const type = variant === 'number' ? 'number' : 
                     variant === 'obscured' ? 'password' : 'text';
        return html`
            <div class=${classMap(classes)}>
                <label>${label}</label>
                <input 
                    type="${type}" 
                    .value="${value}" 
                    @input="${(e: Event) => onChange((e.target as HTMLInputElement).value)}" 
                />
            </div>
        `;
    }
);
