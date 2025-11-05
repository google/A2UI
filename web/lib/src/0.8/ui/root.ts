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
import {
  css,
  html,
  LitElement,
  nothing,
  PropertyValues,
  render,
  TemplateResult,
} from "lit";
import { customElement, property } from "lit/decorators.js";
import { AnyComponentNode, SurfaceID } from "../types/types";
import { effect } from "signal-utils/subtle/microtask-effect";
import { map } from "lit/directives/map.js";
import { A2UIModelProcessor } from "../data/model-processor.js";
import { consume } from "@lit/context";
import { themeContext } from "./context/theme.js";
import { Theme } from "../types/types.js";
import { StringValue } from "../types/primitives.js";
import { structuralStyles } from "./styles";

// This is the base class all the components will inherit
@customElement("a2ui-root")
export class Root extends SignalWatcher(LitElement) {
  @property()
  accessor surfaceId: SurfaceID | null = null;

  @property()
  accessor component: AnyComponentNode | null = null;

  @consume({ context: themeContext })
  accessor theme!: Theme;

  @property({ attribute: false })
  accessor childComponents: AnyComponentNode[] | null = null;

  @property({ attribute: false })
  accessor processor: A2UIModelProcessor | null = null;

  @property()
  accessor dataContextPath: string = "";

  @property()
  set weight(weight: string | number) {
    this.#weight = weight;
    this.style.setProperty("--weight", `${weight}`);
  }

  get weight() {
    return this.#weight;
  }

  #weight: string | number = 1;

  static styles = [
    structuralStyles,
    css`
      :host {
        display: flex;
        gap: 8px;
        max-height: 80%;
      }
    `,
  ];

  /**
   * Holds the cleanup function for our effect.
   * We need this to stop the effect when the component is disconnected.
   */
  #lightDomEffectDisposer: null | (() => void) = null;

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has("childComponents") && this.childComponents) {
      if (this.#lightDomEffectDisposer) {
        this.#lightDomEffectDisposer();
      }

      // This effect watches the A2UI Children signal and updates the Light DOM.
      this.#lightDomEffectDisposer = effect(() => {
        // 1. Read the signal to create the subscription.
        const allChildren = this.childComponents ?? null;

        // 2. Generate the template for the children.
        const lightDomTemplate = this.renderComponentTree(allChildren);

        // 3. Imperatively render that template into the component itself.
        render(lightDomTemplate, this, { host: this });
      });
    }
  }

  /**
   * Clean up the effect when the component is removed from the DOM.
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this.#lightDomEffectDisposer) {
      this.#lightDomEffectDisposer();
    }
  }

  /**
   * Turns the SignalMap into a renderable TemplateResult for Lit.
   */
  private renderComponentTree(
    components: AnyComponentNode[] | null
  ): TemplateResult | typeof nothing {
    if (!components) {
      return nothing;
    }

    if (!Array.isArray(components)) {
      console.warn("Found non-array children", components);
      return nothing;
    }

    return html` ${map(components, (component) => {
      switch (component.type) {
        case "List": {
          const childComponents: AnyComponentNode[] | null =
            component.properties.children;
          return html`<a2ui-list
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .direction=${component.properties.direction ?? "vertical"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${childComponents}
          ></a2ui-list>`;
        }

        case "Card": {
          let childComponents: AnyComponentNode[] | null =
            component.properties.children;
          if (!childComponents && component.properties.child) {
            childComponents = [component.properties.child];
          }

          return html`<a2ui-card
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${childComponents}
            .dataContextPath=${component.dataContextPath ?? ""}
          ></a2ui-card>`;
        }

        case "Column": {
          return html`<a2ui-column
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${component.properties.children ?? null}
            .dataContextPath=${component.dataContextPath ?? ""}
            .alignment=${component.properties.alignment ?? "stretch"}
            .distribution=${component.properties.distribution ?? "start"}
          ></a2ui-column>`;
        }

        case "Row": {
          return html`<a2ui-row
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .childComponents=${component.properties.children ?? null}
            .dataContextPath=${component.dataContextPath ?? ""}
            .alignment=${component.properties.alignment ?? "stretch"}
            .distribution=${component.properties.distribution ?? "start"}
          ></a2ui-row>`;
        }

        case "Image": {
          return html`<a2ui-image
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .url=${component.properties.url ?? null}
            .dataContextPath=${component.dataContextPath ?? ""}
          ></a2ui-image>`;
        }

        case "Icon": {
          return html`<a2ui-icon
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .name=${component.properties.name ?? null}
            .dataContextPath=${component.dataContextPath ?? ""}
          ></a2ui-icon>`;
        }

        case "AudioPlayer": {
          return html`<a2ui-audioplayer
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .url=${component.properties.url ?? null}
            .dataContextPath=${component.dataContextPath ?? ""}
          ></a2ui-audioplayer>`;
        }

        case "Button": {
          return html`<a2ui-button
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath ?? ""}
            .action=${component.properties.action}
            .childComponents=${[component.properties.child]}
          ></a2ui-button>`;
        }

        case "Text": {
          return html`<a2ui-text
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .model=${this.processor}
            .surfaceId=${this.surfaceId}
            .processor=${this.processor}
            .dataContextPath=${component.dataContextPath}
            .text=${component.properties.text}
          ></a2ui-text>`;
        }

        case "Heading": {
          return html`<a2ui-heading
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .text=${component.properties.text}
            .level=${component.properties.level}
          ></a2ui-heading>`;
        }

        case "CheckBox": {
          return html`<a2ui-checkbox
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath ?? ""}
            .label=${component.properties.label}
            .value=${component.properties.value}
          ></a2ui-checkbox>`;
        }

        case "DateTimeInput": {
          return html`<a2ui-datetimeinput
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath ?? ""}
            .enableDate=${component.properties.enableDate ?? true}
            .enableTime=${component.properties.enableTime ?? true}
            .outputFormat=${component.properties.outputFormat}
            .value=${component.properties.value}
          ></a2ui-datetimeinput>`;
        }

        case "Divider": {
          // TODO: thickness, axis and color.
          return html`<a2ui-divider
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .thickness=${component.properties.thickness}
            .axis=${component.properties.axis}
            .color=${component.properties.color}
          ></a2ui-divider>`;
        }

        case "MultipleChoice": {
          // TODO: maxAllowedSelections and selections.
          return html`<a2ui-multiplechoice
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .options=${component.properties.options}
            .maxAllowedSelections=${component.properties.maxAllowedSelections}
            .selections=${component.properties.selections}
          ></a2ui-multiplechoice>`;
        }

        case "Slider": {
          return html`<a2ui-slider
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .value=${component.properties.value}
            .minValue=${component.properties.minValue}
            .maxValue=${component.properties.maxValue}
          ></a2ui-slider>`;
        }

        case "TextField": {
          // TODO: type and validationRegexp.
          return html`<a2ui-textfield
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .label=${component.properties.label}
            .text=${component.properties.text}
            .type=${component.properties.type}
            .validationRegexp=${component.properties.validationRegexp}
          ></a2ui-textfield>`;
        }

        case "Video": {
          return html`<a2ui-video
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .url=${component.properties.url}
          ></a2ui-video>`;
        }

        case "Tabs": {
          const titles: StringValue[] = [];
          const childComponents: AnyComponentNode[] = [];
          if (component.properties.tabItems) {
            for (const item of component.properties.tabItems) {
              titles.push(item.title);
              childComponents.push(item.child);
            }
          }

          return html`<a2ui-tabs
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .titles=${titles}
            .childComponents=${childComponents}
          ></a2ui-tabs>`;
        }

        case "Modal": {
          const childComponents: AnyComponentNode[] = [
            component.properties.entryPointChild,
            component.properties.contentChild,
          ];

          component.properties.entryPointChild.slotName = "entry";

          return html`<a2ui-modal
            id=${component.id}
            slot=${component.slotName ? component.slotName : nothing}
            .component=${component}
            .weight=${component.weight ?? "initial"}
            .processor=${this.processor}
            .surfaceId=${this.surfaceId}
            .dataContextPath=${component.dataContextPath}
            .childComponents=${childComponents}
          ></a2ui-modal>`;
        }
      }
    })}`;
  }

  render(): TemplateResult | typeof nothing {
    return html`<slot></slot>`;
  }
}
