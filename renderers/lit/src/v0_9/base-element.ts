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

import { LitElement } from "lit";
import { property } from "lit/decorators.js";
import { ComponentContext, ComponentApi } from "@a2ui/web_core/v0_9";
import { A2uiController } from "./adapter.js";

/**
 * A base class for A2UI Lit elements that manages the A2uiController lifecycle.
 * 
 * This element handles the reactive attachment and detachment of the `A2uiController`
 * whenever the component's `context` changes. Subclasses only need to implement
 * `createController` to provide their specific schema-bound controller, and `render`
 * to define the template based on the controller's reactive props.
 * 
 * @template Api The specific A2UI component API defining the schema for this element.
 */
export abstract class A2uiLitElement<Api extends ComponentApi> extends LitElement {
  @property({ type: Object }) accessor context!: ComponentContext;
  protected controller!: A2uiController<Api>;
  
  /**
   * Instantiates the unique controller for this element's specific bound API.
   * 
   * Subclasses must implement this method to return an `A2uiController` tied to 
   * their specific component `Api` definition.
   * 
   * @returns A new instance of `A2uiController` matching the component API.
   */
  protected abstract createController(): A2uiController<Api>;

  /**
   * Reacts to changes in the component's properties.
   * 
   * Specifically, when the `context` property changes or is initialized, this method
   * cleans up any existing controller and invokes `createController()` to bind to
   * the new context.
   */
  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('context') && this.context) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
      }
      this.controller = this.createController();
    }
  }
}
