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

import { html, nothing, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { SurfaceModel, ComponentContext } from "@a2ui/web_core/v0_9";
import { renderA2uiNode } from "./render-a2ui-node.js";
import { LitComponentApi } from "@a2ui/lit/v0_9";

@customElement("a2ui-surface")
export class A2uiSurface extends LitElement {
  @property({ type: Object }) accessor surface:
    | SurfaceModel<LitComponentApi>
    | undefined;

  @state() accessor _hasRoot = false;
  private unsub?: () => void;

  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has("surface")) {
      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }
      this._hasRoot = !!this.surface?.componentsModel.get("root");

      if (this.surface && !this._hasRoot) {
        const sub = this.surface.componentsModel.onCreated.subscribe((comp) => {
          if (comp.id === "root") {
            this._hasRoot = true;
            this.unsub?.();
            this.unsub = undefined;
          }
        });
        this.unsub = () => sub.unsubscribe();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsub) {
      this.unsub();
      this.unsub = undefined;
    }
  }

  render() {
    if (!this.surface) return nothing;
    if (!this._hasRoot) {
      return html`<slot name="loading"><div>Loading surface...</div></slot>`;
    }

    try {
      const rootContext = new ComponentContext(this.surface, "root", "/");
      return html`${renderA2uiNode(rootContext, this.surface.catalog)}`;
    } catch (e) {
      console.error("Error creating root context:", e);
      return html`<div>Error rendering surface</div>`;
    }
  }
}
