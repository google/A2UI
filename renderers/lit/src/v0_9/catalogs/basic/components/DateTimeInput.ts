import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { DateTimeInputApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiDateTimeInput = createLitComponent(DateTimeInputApi, ({ props }) => {
  const type = (props.enableDate && props.enableTime) ? "datetime-local" : (props.enableDate ? "date" : "time");
  return html`
    <div class="a2ui-datetime">
      ${props.label ? html`<label>${props.label}</label>` : ""}
      <input type=${type} .value=${props.value || ""} @input=${(e: Event) => props.setValue?.((e.target as HTMLInputElement).value)} />
    </div>
  `;
});