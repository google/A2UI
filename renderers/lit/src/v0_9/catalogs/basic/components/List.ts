import { html } from "lit";
import { map } from "lit/directives/map.js";
import { styleMap } from "lit/directives/style-map.js";
import { createLitComponent } from "../../../adapter.js";
import { ListApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiList = createLitComponent(ListApi, ({ props, buildChild }) => {
  const children = Array.isArray(props.children) ? props.children : [];
  const styles = { display: "flex", flexDirection: props.direction === "horizontal" ? "row" : "column", overflow: "auto", gap: "8px" };
  return html`<div class="a2ui-list" style=${styleMap(styles)}>${map(children, (child: any) => typeof child === 'string' ? buildChild(child) : buildChild(child.id, child.basePath))}</div>`;
});