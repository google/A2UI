import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { createLitComponent } from "../../../adapter.js";
import { TextFieldApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiTextField = createLitComponent(TextFieldApi, ({ props }) => {
  const isInvalid = props.isValid === false;

  const onInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (props.setValue) {
      props.setValue(target.value);
    }
  };

  const classes = {
    "a2ui-textfield": true,
    "a2ui-textfield-invalid": isInvalid,
  };

  let type = "text";
  if (props.variant === "number") type = "number";
  if (props.variant === "obscured") type = "password";

  return html`
    <div class="a2ui-textfield-container">
      ${props.label ? html`<label>${props.label}</label>` : ""}
      
      ${props.variant === "longText" 
        ? html`
          <textarea
            class=${classMap(classes)}
            .value=${props.value || ""}
            @input=${onInput}
            pattern=${props.validationRegexp || undefined}
          ></textarea>`
        : html`
          <input
            type=${type}
            class=${classMap(classes)}
            .value=${props.value || ""}
            @input=${onInput}
            pattern=${props.validationRegexp || undefined}
          />`
      }
      
      ${isInvalid && props.validationErrors && props.validationErrors.length > 0
        ? html`<div class="a2ui-error-message">${props.validationErrors[0]}</div>`
        : ""}
    </div>
  `;
});