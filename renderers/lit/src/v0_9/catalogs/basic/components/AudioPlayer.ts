import { html } from "lit";
import { createLitComponent } from "../../../adapter.js";
import { AudioPlayerApi } from "@a2ui/web_core/v0_9/basic_catalog";

export const A2uiAudioPlayer = createLitComponent(AudioPlayerApi, ({ props }) => {
  return html`
    <div class="a2ui-audioplayer">
      ${props.description ? html`<p>${props.description}</p>` : ""}
      <audio src=${props.url} controls></audio>
    </div>`;
});