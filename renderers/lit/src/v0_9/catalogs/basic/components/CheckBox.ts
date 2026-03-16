import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { CheckBoxApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiCheckBox = createLitComponent(CheckBoxApi, ({ props }) => {
  return html`
    <label class="a2ui-checkbox">
      <input type="checkbox" .checked=${props.value || false} @change=${(e: Event) => props.setValue?.((e.target as HTMLInputElement).checked)} />
      ${props.label}
    </label>
  `;
});