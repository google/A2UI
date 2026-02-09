import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { CheckBoxComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litCheckBox = new CheckBoxComponent<TemplateResult>(
    ({ label, value, onChange, weight }, context) => {
        const classes = context.surfaceContext.theme.components.CheckBox;
        const a11y = getAccessibilityAttributes(context);
        const styles: Record<string, string> = {};
        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }

        return html`
        <div class=${classMap(classes)} style=${styleMap(styles)}>
            <label>
                <input 
                    type="checkbox" 
                    .checked="${value}" 
                    @change="${(e: Event) => onChange((e.target as HTMLInputElement).checked)}"
                    aria-label=${a11y['aria-label'] || label}
                    aria-description=${a11y['aria-description'] || null}
                />
                ${label}
            </label>
        </div>
    `;
    }
);
