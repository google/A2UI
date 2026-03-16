import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { createLitComponent } from "../../../adapter.js";
import { ButtonApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiButton = createLitComponent(ButtonApi, ({ props, buildChild }) => {
  const isDisabled = props.isValid === false;

  const onClick = () => {
    if (!isDisabled && props.action) {
      props.action();
    }
  };

  const classes = {
    "a2ui-button": true,
    "a2ui-button-primary": props.variant === "primary",
    "a2ui-button-borderless": props.variant === "borderless",
  };

  return html`
    <button 
      class=${classMap(classes)} 
      @click=${onClick} 
      ?disabled=${isDisabled}
    >
      ${props.child ? buildChild(props.child) : ""}
    </button>
  `;
});