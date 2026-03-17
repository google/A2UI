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

import { Injectable, Type } from '@angular/core';
import { Types } from '../types';

@Injectable({
  providedIn: 'root',
})
export class Catalog {
  private readonly components = new Map<string, Type<unknown>>();
  private readonly instances = new Map<string, Types.AnyComponentNode>();

  registerComponent(type: string, component: Type<unknown>) {
    this.components.set(type, component);
  }

  getComponentConfig(type: string): Type<unknown> | undefined {
    return this.components.get(type);
  }

  registerInstance(id: string, node: Types.AnyComponentNode) {
    this.instances.set(id, node);
  }

  getComponent(id: string): Types.AnyComponentNode | undefined {
    return this.instances.get(id);
  }

  clear() {
    this.instances.clear();
  }
}
