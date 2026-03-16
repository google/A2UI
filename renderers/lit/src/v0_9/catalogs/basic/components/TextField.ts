import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { createLitComponent } from "../../../adapter.js";
import { TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiTextField = createLitComponent(TextFieldApi, ({ props }) => {
  const isInvalid = props.isValid === false;
  const onInput = (e: Event) => props.setValue?.((e.target as HTMLInputElement).value);
  let type = "text";
  if (props.variant === "number") type = "number";
  if (props.variant === "obscured") type = "password";

  return html`
    <div class="a2ui-textfield-container">
      ${props.label ? html`<label>${props.label}</label>` : ""}
      ${props.variant === "longText" 
        ? html`<textarea class=${classMap({"a2ui-textfield": true, "invalid": isInvalid})} .value=${props.value || ""} @input=${onInput}></textarea>`
        : html`<input type=${type} class=${classMap({"a2ui-textfield": true, "invalid": isInvalid})} .value=${props.value || ""} @input=${onInput} />`
      }
      ${isInvalid && props.validationErrors?.length ? html`<div class="error">${props.validationErrors[0]}</div>` : ""}
    </div>
  `;
});