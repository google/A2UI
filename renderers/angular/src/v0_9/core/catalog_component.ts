/*
 * Copyright 2026 Google LLC
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

import {ComponentApi} from '@a2ui/web_core/v0_9';
import {Directive, input, Signal} from '@angular/core';
import {ComponentApiToProps} from './types';

/** Describes the properties that a Catalog component needs to implement. For ease of use, please extend CatalogComponent. */
export interface CatalogComponentInstance {
  readonly props: Signal<Record<string, unknown>>;
  readonly surfaceId: Signal<string>;
  readonly componentId: Signal<string>;
  readonly dataContextPath: Signal<string>;
}

/**
 * Base class for A2UI catalog component in Angular.
 *
 * All Angular catalog components should extend this base class,
 * which provides type safe access to props() and other common
 * fields.
 */
@Directive()
export abstract class CatalogComponent<
  Api extends ComponentApi,
> implements CatalogComponentInstance {
  /**
   * Reactive properties resolved from the A2UI ComponentModel.
   */
  readonly props = input<ComponentApiToProps<Api>>({} as any);
  readonly surfaceId = input.required<string>();
  readonly componentId = input.required<string>();
  readonly dataContextPath = input<string>('/');
}
