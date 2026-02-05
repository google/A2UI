import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { CheckBoxComponent } from '@a2ui/web_core/v0_9';

export const litCheckBox = new CheckBoxComponent<TemplateResult>(
    ({ label, value, onChange }, context) => {
        const classes = context.surfaceContext.theme.components.CheckBox;
        return html`
        <div class=${classMap(classes)}>
            <label>
                <input 
                    type="checkbox" 
                    .checked="${value}" 
                    @change="${(e: Event) => onChange((e.target as HTMLInputElement).checked)}" 
                />
                ${label}
            </label>
        </div>
    `;
    }
);
