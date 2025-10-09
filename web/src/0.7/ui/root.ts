/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
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
import {
  AudioPlayer,
  Button,
  Card,
  Checkbox,
  Column,
  Component,
  ComponentType,
  DateTimeInput,
  Divider,
  Heading,
  Image,
  List,
  MultipleChoice,
  Row,
  Slider,
  Text,
  TextField,
  Video,
} from "../types/component-update";
import { TagName } from "./ui";
import { effect } from "signal-utils/subtle/microtask-effect";
import { map } from "lit/directives/map.js";
import { DataModel } from "../data/model";
import { consume } from "@lit/context";
import { themeContext } from "./context/theme";
import { Theme } from "../types/types";
import * as Styles from "./styles";

const elementMap: Map<ComponentType, TagName> = new Map([
  ["AudioPlayer", "gulf-audioplayer"],
  ["Button", "gulf-button"],
  ["Card", "gulf-card"],
  ["CheckBox", "gulf-checkbox"],
  ["Column", "gulf-column"],
  ["DateTimeInput", "gulf-datetimeinput"],
  ["Divider", "gulf-divider"],
  ["Heading", "gulf-heading"],
  ["Image", "gulf-image"],
  ["List", "gulf-list"],
  ["MultipleChoice", "gulf-multiplechoice"],
  ["Row", "gulf-row"],
  ["Slider", "gulf-slider"],
  ["Text", "gulf-text"],
  ["TextField", "gulf-textfield"],
  ["Video", "gulf-video"],
]);

// This is the new base class all your components will inherit
@customElement("gulf-root")
export class Root extends SignalWatcher(LitElement) {
  @consume({ context: themeContext })
  accessor theme!: Theme;

  @property({ attribute: false })
  accessor components: Component[] | null = null;

  @property({ attribute: false })
  accessor model: DataModel | null = null;

  @property()
  accessor dataPrefix: string = "";

  @property()
  set weight(weight: number) {
    this.#weight = weight;
    this.style.setProperty("--weight", `${weight}`);
  }

  get weight() {
    return this.#weight;
  }

  #weight = 0;

  static styles = [
    Styles.all,
    css`
      :host {
        display: flex;
        gap: 8px;
      }

      ::slotted(*) {
        flex: 1;
        margin-bottom: 8px;
        align-items: flex-start;
      }
    `,
  ];

  /**
   * Holds the cleanup function for our effect.
   * We need this to stop the effect when the component is disconnected.
   */
  #lightDomEffectDisposer: null | (() => void) = null;

  protected willUpdate(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has("components") && this.components) {
      if (this.#lightDomEffectDisposer) {
        this.#lightDomEffectDisposer();
      }

      // This effect watches the gulfChildren signal and updates the Light DOM.
      this.#lightDomEffectDisposer = effect(() => {
        // 1. Read the signal to create the subscription.
        const allComponents = this.components;

        // 2. Generate the template for the children.
        const lightDomTemplate = this.renderComponents(allComponents);

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
  private renderComponents(
    children: Component[] | null
  ): TemplateResult | typeof nothing {
    if (!children) {
      return nothing;
    }

    // Subscribes to the Signals.
    if (!Array.isArray(children)) {
      console.warn("Found non-array children", children);
      return nothing;
    }

    return html`
      ${map(children, (childData) => {
        return html`${map(
          Object.entries(childData.componentProperties),
          ([id, component]) => {
            const elementId = id as ComponentType;
            const elementName = elementMap.get(elementId) ?? "gulf-unknown";

            switch (elementName) {
              case "gulf-list": {
                const renderableComponent = component as List;
                return html`<gulf-list
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .direction=${renderableComponent.direction ?? "vertical"}
                  .model=${this.model}
                  .components=${renderableComponent.children}
                ></gulf-list>`;
              }

              case "gulf-card": {
                const renderableComponent = component as Card;
                return html`<gulf-card
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .components=${renderableComponent.children}
                ></gulf-card>`;
              }

              case "gulf-heading": {
                const renderableComponent = component as Heading;
                return html`<gulf-heading
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .text=${renderableComponent.text}
                  .level=${renderableComponent.level}
                ></gulf-heading>`;
              }

              case "gulf-column": {
                const renderableComponent = component as Column;
                return html`<gulf-column
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .alignment=${renderableComponent.alignment}
                  .distribution=${renderableComponent.distribution}
                  .components=${renderableComponent.children}
                ></gulf-column>`;
              }

              case "gulf-row": {
                const renderableComponent = component as Row;
                return html`<gulf-row
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .alignment=${renderableComponent.alignment}
                  .distribution=${renderableComponent.distribution}
                  .components=${renderableComponent.children}
                ></gulf-row>`;
              }

              case "gulf-image": {
                const renderableComponent = component as Image;
                return html`<gulf-image
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .url=${renderableComponent.url}
                ></gulf-image>`;
              }

              case "gulf-audioplayer": {
                const renderableComponent = component as AudioPlayer;
                return html`<gulf-audio
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .url=${renderableComponent.url}
                ></gulf-audio>`;
              }

              case "gulf-text": {
                const renderableComponent = component as Text;
                return html`<gulf-text
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .text=${renderableComponent.text}
                ></gulf-text>`;
              }

              case "gulf-button": {
                const renderableComponent = component as Button;
                return html`<gulf-button
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .label=${renderableComponent.label}
                  .action=${renderableComponent.action}
                ></gulf-button>`;
              }

              case "gulf-divider": {
                // TODO: thickness, axis & distribution.
                const renderableComponent = component as Divider;
                return html`<gulf-divider
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .thickness=${renderableComponent.thickness}
                  .axis=${renderableComponent.axis}
                  .color=${renderableComponent.color}
                ></gulf-divider>`;
              }

              case "gulf-video": {
                const renderableComponent = component as Video;
                return html`<gulf-video
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .url=${renderableComponent.url}
                ></gulf-video>`;
              }

              case "gulf-textfield": {
                // TODO: type and validationRegexp.
                const renderableComponent = component as TextField;
                return html`<gulf-textfield
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .label=${renderableComponent.label}
                  .text=${renderableComponent.text}
                  .type=${renderableComponent.type}
                  .validationRegexp=${renderableComponent.validationRegexp}
                ></gulf-textfield>`;
              }

              case "gulf-datetimeinput": {
                // TODO: enableDate, enableTime and outputFormat.
                const renderableComponent = component as DateTimeInput;
                return html`<gulf-datetimeinput
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .enableDate=${renderableComponent.enableDate}
                  .enableTime=${renderableComponent.enableTime}
                  .outputFormat=${renderableComponent.outputFormat}
                  .value=${renderableComponent.value}
                ></gulf-datetimeinput>`;
              }

              case "gulf-slider": {
                const renderableComponent = component as Slider;
                return html`<gulf-slider
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .value=${renderableComponent.value}
                  .minValue=${renderableComponent.minValue}
                  .maxValue=${renderableComponent.maxValue}
                ></gulf-slider>`;
              }

              case "gulf-multiplechoice": {
                // TODO: maxAllowedSelections and selections.
                const renderableComponent = component as MultipleChoice;
                return html`<gulf-text
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .options=${renderableComponent.options}
                  .maxAllowedSelections=${renderableComponent.maxAllowedSelections}
                  .selections=${renderableComponent.selections}
                ></gulf-text>`;
              }

              case "gulf-checkbox": {
                // TODO: maxAllowedSelections and selections.
                const renderableComponent = component as Checkbox;
                return html`<gulf-checkbox
                  id=${childData.id}
                  .weight=${childData.weight ?? 1}
                  .model=${this.model}
                  .dataPrefix=${childData.dataPrefix}
                  .value=${renderableComponent.value}
                  .label=${renderableComponent.label}
                ></gulf-checkbox>`;
              }

              default:
                console.log(childData);
                break;
            }
          }
        )}`;
      })}
    `;
  }

  render(): TemplateResult | typeof nothing {
    return html`<slot></slot>`;
  }
}
