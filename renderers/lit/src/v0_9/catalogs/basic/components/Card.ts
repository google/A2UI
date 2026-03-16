import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { CardApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiCard = createLitComponent(CardApi, ({ props, buildChild }) => {
  return html`<div class="a2ui-card" style="border: 1px solid #ccc; border-radius: 8px; padding: 16px;">${props.child ? buildChild(props.child) : ""}</div>`;
});