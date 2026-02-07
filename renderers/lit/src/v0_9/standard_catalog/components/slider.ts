import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { SliderComponent } from '@a2ui/web_core/v0_9';

export const litSlider = new SliderComponent<TemplateResult>(
    ({ label, min, max, value, onChange, weight }, context) => {
        const classes = context.surfaceContext.theme.components.Slider;
        const styles: Record<string, string> = {};
        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }

        return html`
        <div class=${classMap(classes)} style=${styleMap(styles)}>
            <label>${label}</label>
            <input 
                type="range" 
                min="${min}" 
                max="${max}" 
                .value="${value.toString()}" 
                @input="${(e: Event) => onChange(Number((e.target as HTMLInputElement).value))}" 
            />
            <span>${value}</span>
        </div>
    `;
    }
);
