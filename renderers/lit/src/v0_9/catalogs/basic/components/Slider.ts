import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { SliderApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiSlider = createLitComponent(SliderApi, ({ props }) => {
  return html`
    <div class="a2ui-slider">
      ${props.label ? html`<label>${props.label}</label>` : ""}
      <input type="range" min=${props.min ?? 0} max=${props.max ?? 100} .value=${props.value?.toString() || "0"} @input=${(e: Event) => props.setValue?.(Number((e.target as HTMLInputElement).value))} />
      <span>${props.value}</span>
    </div>
  `;
});