import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ChoicePickerComponent } from '@a2ui/web_core/v0_9';

export const litChoicePicker = new ChoicePickerComponent<TemplateResult>(
    ({ label, options, value, variant, onChange }, context) => {
        const classes = context.surfaceContext.theme.components.ChoicePicker;
        // Simple select implementation for now
        const isMultiple = variant === 'multipleSelection';
        const handleChange = (e: Event) => {
            const select = e.target as HTMLSelectElement;
            if (isMultiple) {
                const values = Array.from(select.selectedOptions).map(opt => opt.value);
                onChange(values);
            } else {
                onChange([select.value]);
            }
        };

        return html`
            <div class=${classMap(classes)}>
                <label>${label}</label>
                <select 
                    ?multiple="${isMultiple}" 
                    @change="${handleChange}"
                >
                    ${options.map(opt => html`
                        <option 
                            value="${opt.value}" 
                            ?selected="${value.includes(opt.value)}"
                        >
                            ${opt.label}
                        </option>
                    `)}
                </select>
            </div>
        `;
    }
);
