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

import { LitElement, nothing } from "lit";
import { property } from "lit/decorators.js";
import { ComponentContext, ComponentApi } from "@a2ui/web_core/v0_9";
import { renderA2uiNode } from "./surface/render-a2ui-node.js";
import { A2uiController } from "@a2ui/lit/v0_9";

/**
 * Represents a reference to a child component that should be rendered.
 * In A2UI, a child can be provided in one of three ways:
 *
 * 1. A string ID (e.g., "submit_button"). Tells the renderer to look up the component
 *    from the Surface's registry. The child will inherit the parent's data context path.
 * 2. A reference object (e.g., { id: 'foo', basePath: '/bar' }). Tells the renderer where
 *    to find the component AND binds it to a specific slice of the data model.
 * 3. An inline component object (e.g., { type: 'Button', props: { ... } }). Provides the
 *    full component definition directly instead of looking it up by ID.
 *
 * (This probably should come from the binder in web_core!)
 */
type A2uiChildRef = string | { id?: string; basePath?: string; type?: string };

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
export abstract class A2uiLitElement<
  Api extends ComponentApi,
> extends LitElement {
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
   * Helper method to render a child A2UI node.
   * Abstracts away the need to manually create a ComponentContext.
   *
   * @param childRef The reference to the child component to render. Can be a string ID,
   *                 a reference object containing `{ id, basePath }`, or a full inline component definition.
   * @param customPath An explicit data model path to bind the child to. If provided,
   *                   this completely overrides any path defined in the `childRef` object.
   *                   If omitted, it falls back to the `childRef`'s `basePath`, or the current component's path.
   *
   * @returns A Lit template result containing the rendered child component, or `nothing` if the reference is empty.
   */
  protected renderNode(childRef?: A2uiChildRef, customPath?: string) {
    if (!childRef) return nothing;
    let model: any = childRef;
    const { surface, path: parentPath } = this.context.dataContext;

    // Path is resolved in the following order:
    //   customPath > childRef.basePath > parentPath
    let path = customPath;

    // We check !childRef.type because an inline component definition (e.g. { type: 'Button' })
    // should be passed directly to the ComponentContext. If it doesn't have a .type,
    // we treat it as a child reference object (e.g. { id: 'foo', basePath: '/bar' }).
    if (
      typeof childRef === "object" &&
      childRef !== null &&
      childRef.id &&
      !childRef.type
    ) {
      model = childRef.id;
      path = path ?? childRef.basePath;
    }

    // Fallback to the current component's context.
    path = path ?? parentPath;

    return renderA2uiNode(
      new ComponentContext(surface, model, path),
      surface.catalog,
    );
  }

  /**
   * Reacts to changes in the component's properties.
   *
   * Specifically, when the `context` property changes or is initialized, this method
   * cleans up any existing controller and invokes `createController()` to bind to
   * the new context.
   */
  willUpdate(changedProperties: Map<string, any>) {
    super.willUpdate(changedProperties);
    if (changedProperties.has("context") && this.context) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
      }
      this.controller = this.createController();
    }
  }
}
