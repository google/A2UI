import { html, TemplateResult } from 'lit';
import { CheckBoxComponent } from '@a2ui/web_core/v0_9';

export const litCheckBox = new CheckBoxComponent<TemplateResult>(
    ({ label, value, onChange }) => html`
        <div class="a2ui-checkbox">
            <label>
                <input 
                    type="checkbox" 
                    .checked="${value}" 
                    @change="${(e: Event) => onChange((e.target as HTMLInputElement).checked)}" 
                />
                ${label}
            </label>
        </div>
    `
);
