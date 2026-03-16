import { html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { createLitComponent } from "../../../adapter.js";
import { ButtonApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiButton = createLitComponent(ButtonApi, ({ props, buildChild }) => {
  const isDisabled = props.isValid === false;
  return html`
    <button 
      class=${classMap({"a2ui-button": true, ["a2ui-button-" + (props.variant || "default")]: true})} 
      @click=${() => !isDisabled && props.action && props.action()} 
      ?disabled=${isDisabled}
    >
      ${props.child ? buildChild(props.child) : ""}
    </button>
  `;
});