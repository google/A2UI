import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { DividerApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiDivider = createLitComponent(DividerApi, ({ props }) => {
  return props.axis === "vertical" 
    ? html`<div class="a2ui-divider-vertical" style="width: 1px; background: #ccc; height: 100%;"></div>`
    : html`<hr class="a2ui-divider" style="border: none; border-top: 1px solid #ccc; margin: 16px 0;" />`;
});