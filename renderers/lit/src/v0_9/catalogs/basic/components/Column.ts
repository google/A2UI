import { html } from "lit";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { createLitComponent } from "../../../adapter.js";
import { ColumnApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiColumn = createLitComponent(ColumnApi, ({ props, buildChild }) => {
  const children = Array.isArray(props.children) ? props.children : [];
  const styles = { display: "flex", flexDirection: "column", flex: props.weight !== undefined ? String(props.weight) : "initial", gap: "8px" };
  return html`<div class="a2ui-column" style=${styleMap(styles)}>${map(children, (child: any) => typeof child === 'string' ? buildChild(child) : buildChild(child.id, child.basePath))}</div>`;
});