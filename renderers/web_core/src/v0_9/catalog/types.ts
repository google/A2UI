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

import { z } from "zod";
import { DataContext } from "../rendering/data-context.js";
import { Observable } from "rxjs";

/**
 * A function implementation that can be registered with the evaluator or basic catalog.
 */
export type FunctionImplementation = (
  args: Record<string, unknown>,
  context: DataContext,
) => unknown | Observable<unknown>;

/**
 * A definition of a UI component's API.
 * This interface defines the contract for a component's capabilities and properties,
 * independent of any specific rendering implementation.
 */
export interface ComponentApi {
  /** The name of the component as it appears in the A2UI JSON (e.g., 'Button'). */
  name: string;

  /**
   * The Zod schema describing the **properties** of this component.
   *
   * - MUST include catalog-specific common properties (e.g. 'weight', 'accessibility').
   * - MUST NOT include 'component' or 'id' as those are handled by the framework/envelope.
   */
  readonly schema: z.ZodType<any>;
}

/**
 * A collection of available components and functions.
 */
export class Catalog<T extends ComponentApi> {
  readonly id: string;

  /**
   * A map of available components.
   * This is readonly to encourage immutable extension patterns.
   */
  readonly components: ReadonlyMap<string, T>;

  /**
   * Optional map of functions provided by this catalog.
   */
  readonly functions?: ReadonlyMap<string, FunctionImplementation>;

  constructor(id: string, components: T[], functions?: Record<string, any>) {
    this.id = id;
    const map = new Map<string, T>();
    for (const comp of components) {
      map.set(comp.name, comp);
    }
    this.components = map;

    if (functions) {
      const funcMap = new Map<string, any>();
      for (const [name, fn] of Object.entries(functions)) {
        funcMap.set(name, fn);
      }
      this.functions = funcMap;
    }
  }
}
