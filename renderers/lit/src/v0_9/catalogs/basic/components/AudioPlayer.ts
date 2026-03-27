/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { html, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { AudioPlayerApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { A2uiLitElement, A2uiController } from "@a2ui/lit/v0_9";

@customElement("a2ui-audioplayer")
export class A2uiAudioPlayerElement extends A2uiLitElement<
  typeof AudioPlayerApi
> {
  protected createController() {
    return new A2uiController(this, AudioPlayerApi);
  }

  render() {
    const props = this.controller.props;
    if (!props) return nothing;

    return html`<div class="a2ui-audioplayer">
      ${props.description ? html`<p>${props.description}</p>` : nothing}
      <audio src=${props.url} controls></audio>
    </div>`;
  }
}

export const A2uiAudioPlayer = {
  ...AudioPlayerApi,
  tagName: "a2ui-audioplayer",
};
