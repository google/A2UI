import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { SliderComponent } from '@a2ui/web_core/v0_9';

export const litSlider = new SliderComponent<TemplateResult>(
    ({ label, min, max, value, onChange }, context) => {
        const classes = context.surfaceContext.theme.components.Slider;
        return html`
        <div class=${classMap(classes)}>
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
