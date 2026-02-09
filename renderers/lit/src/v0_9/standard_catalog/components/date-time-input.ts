import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DateTimeInputComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litDateTimeInput = new DateTimeInputComponent<TemplateResult>(
    ({ label, value, min, max, enableDate, enableTime, onChange, weight }, context) => {
        const classes = context.surfaceContext.theme.components.DateTimeInput;
        const a11y = getAccessibilityAttributes(context);
        // Determine type based on flags
        let type = 'text';
        if (enableDate && enableTime) type = 'datetime-local';
        else if (enableDate) type = 'date';
        else if (enableTime) type = 'time';

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
                    min="${min || undefined}" 
                    max="${max || undefined}"
                    @input="${(e: Event) => onChange((e.target as HTMLInputElement).value)}"
                    aria-label=${a11y['aria-label'] || label}
                    aria-description=${a11y['aria-description'] || null}
                />
            </div>
        `;
    }
);
