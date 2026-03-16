import { html } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { createLitComponent } from "../../../adapter.js";
import { ImageApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiImage = createLitComponent(ImageApi, ({ props }) => {
  const styles = { objectFit: props.fit || "fill", width: "100%" };
  return html`<img src=${props.url} class=${"a2ui-image " + (props.variant || "")} style=${styleMap(styles)} />`;
});