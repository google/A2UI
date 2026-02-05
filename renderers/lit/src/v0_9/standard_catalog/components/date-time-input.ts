import { html, TemplateResult } from 'lit';
import { DateTimeInputComponent } from '@a2ui/web_core/v0_9';

export const litDateTimeInput = new DateTimeInputComponent<TemplateResult>(
    ({ label, value, min, max, enableDate, enableTime, onChange }) => {
        // Determine type based on flags
        let type = 'text';
        if (enableDate && enableTime) type = 'datetime-local';
        else if (enableDate) type = 'date';
        else if (enableTime) type = 'time';

        return html`
            <div class="a2ui-date-time">
                <label>${label}</label>
                <input 
                    type="${type}" 
                    .value="${value}" 
                    min="${min || undefined}" 
                    max="${max || undefined}"
                    @input="${(e: Event) => onChange((e.target as HTMLInputElement).value)}" 
                />
            </div>
        `;
    }
);
