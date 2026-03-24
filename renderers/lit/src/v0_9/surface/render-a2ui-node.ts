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

import { nothing } from "lit";
import { html, unsafeStatic } from "lit/static-html.js";
import { ComponentContext, Catalog } from "@a2ui/web_core/v0_9";
import { LitComponentApi } from "@a2ui/lit/v0_9";

/**
 * Pure function that acts as a generic container for A2UI components.
 *
 * It dynamically resolves and renders the specific Lit component implementation
 * based on the component type provided in the context, returning a TemplateResult directly
 * to avoid duplicate DOM node wrapping.
 *
 * @param context The component context defining the data model and type to render.
 * @returns A Lit TemplateResult representing the resolved component, or `nothing` if the component is invalid or unresolvable.
 *
 * For examples on how to use `renderA2uiNode` when defining custom A2UI components that contain children,
 * refer to the implementation of `A2uiSurface`, or structural catalog components like `Row` and `Column`.
 */
export function renderA2uiNode(
  context: ComponentContext,
  catalog: Catalog<LitComponentApi>,
) {
  const type = context.componentModel.type;
  const implementation = catalog.components.get(type);

  if (!implementation) {
    console.warn(`Component implementation not found for type: ${type}`);
    return nothing;
  }

  const tag = unsafeStatic(implementation.tagName);
  return html`<${tag} .context=${context}></${tag}>`;
}
