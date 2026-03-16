import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { ChoicePickerApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiChoicePicker = createLitComponent(ChoicePickerApi, ({ props }) => {
  const selected = Array.isArray(props.value) ? props.value : [];
  const isMulti = props.variant === "multipleSelection";
  
  const toggle = (val: string) => {
    if (!props.setValue) return;
    if (isMulti) {
      if (selected.includes(val)) props.setValue(selected.filter(v => v !== val));
      else props.setValue([...selected, val]);
    } else {
      props.setValue([val]);
    }
  };

  return html`
    <div class="a2ui-choicepicker">
      ${props.label ? html`<label>${props.label}</label>` : ""}
      <div class="options">
        ${props.options?.map((opt: any) => html`
          <label>
            <input type=${isMulti ? "checkbox" : "radio"} .checked=${selected.includes(opt.value)} @change=${() => toggle(opt.value)} />
            ${opt.label}
          </label>
        `)}
      </div>
    </div>
  `;
});