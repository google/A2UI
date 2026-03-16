import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { VideoApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiVideo = createLitComponent(VideoApi, ({ props }) => {
  return html`<video src=${props.url} controls class="a2ui-video"></video>`;
});