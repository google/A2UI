/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { SignalWatcher } from "@lit-labs/signals";
import { consume } from "@lit/context";
import {
  css,
  html,
  LitElement,
  nothing,
  TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  Theme,
  AnyResolvedNode,
  SurfaceID,
  MessageProcessor,
} from "../../core/types/types.js";
import { themeContext } from "../context/theme.js";
import { processorContext } from "../context/processor.js";
import { surfaceIdContext } from "../context/surfaceId.js";
import { structuralStyles } from "./styles.js";

// This is the base class all the components will inherit
@customElement("a2ui-root")
export class Root<T extends AnyResolvedNode = AnyResolvedNode> extends SignalWatcher(LitElement) {
  @property({ attribute: false })
  set node(node: T) {
    this.#node = node;
    if (node) {
      this.style.setProperty("--weight", `${node.weight}`);
    }
  }

  get node(): T {
    return this.#node;
  }

  #node!: T;

  get id() {
    return this.node?.id ?? "";
  }

  @property({ attribute: false })
  accessor renderChild!: (child: AnyResolvedNode) => TemplateResult | null;
  
  @consume({ context: surfaceIdContext })
  @property()
  accessor surfaceId: SurfaceID | undefined = undefined;

  @consume({ context: themeContext })
  accessor theme!: Theme;

  @consume({ context: processorContext })
  @property({ attribute: false })
  accessor processor: MessageProcessor | undefined = undefined;

  get dataContextPath() {
    return this.node?.dataContextPath ?? "";
  }

  static styles = [
    structuralStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 80%;
      }
    `,
  ];

  render(): TemplateResult | typeof nothing {
    return html`<slot></slot>`;
  }
}
