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

import { CustomElementConstructorOf } from "./ui.js";

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private registry: Map<string, CustomElementConstructorOf<HTMLElement>> = new Map();

  private constructor() {}

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  register(
    typeName: string,
    constructor: CustomElementConstructorOf<HTMLElement>,
    tagName?: string
  ) {
    this.registry.set(typeName, constructor);
    const actualTagName = tagName || `a2ui-custom-${typeName.toLowerCase()}`;
    console.log(`[Registry] Registering ${typeName} as ${actualTagName}`);

    const existingName = customElements.getName(constructor);
    if (existingName) {
      console.log(`[Registry] Constructor already registered as ${existingName}`);
      // Constructor is already registered.
      if (existingName !== actualTagName) {
        console.warn(`Component ${typeName} is already registered as ${existingName}, but requested as ${actualTagName}. Using existing registration.`);
      }
      return;
    }

    if (!customElements.get(actualTagName)) {
      console.log(`[Registry] Defining ${actualTagName}`);
      customElements.define(actualTagName, constructor);
    } else {
      console.log(`[Registry] Tag ${actualTagName} already defined`);
    }
  }

  get(typeName: string): CustomElementConstructorOf<HTMLElement> | undefined {
    return this.registry.get(typeName);
  }
}
