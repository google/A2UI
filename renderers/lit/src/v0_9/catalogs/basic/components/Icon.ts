import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { IconApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiIcon = createLitComponent(IconApi, ({ props }) => {
  const name = typeof props.name === 'string' ? props.name : (props.name as any)?.path;
  return html`<span class="material-symbols-outlined a2ui-icon">${name}</span>`;
});