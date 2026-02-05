import { html, TemplateResult } from 'lit';
import { SliderComponent } from '@a2ui/web_core/v0_9';

export const litSlider = new SliderComponent<TemplateResult>(
    ({ label, min, max, value, onChange }) => html`
        <div class="a2ui-slider">
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
    `
);
