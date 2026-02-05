import { html, TemplateResult } from 'lit';
import { TextFieldComponent } from '@a2ui/web_core/v0_9';

export const litTextField = new TextFieldComponent<TemplateResult>(
    ({ label, value, variant, onChange }) => {
        const type = variant === 'number' ? 'number' : 
                     variant === 'obscured' ? 'password' : 'text';
        return html`
            <div class="a2ui-text-field">
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
