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

import {Signal} from '@preact/signals-core';
import {EventSource} from '../common/events.js';

/**
 * An A2uiNode represents a fully resolved, living instance of a component in the view hierarchy.
 */
export interface A2uiNode<TProps = Record<string, any>> {
  /**
   * A stable, unique identifier for this instance in the rendered tree.
   * For templated nodes, this incorporates the data path.
   */
  readonly instanceId: string;

  /** The original component ID from the A2UI payload. */
  readonly componentId: string;

  /** The component type (e.g., 'Text', 'Button'). */
  readonly type: string;

  /** The base data path this node is scoped to. */
  readonly dataPath: string;

  /** Fully resolved, strongly-typed properties. */
  readonly props: Signal<TProps>;

  /** Signals that the node is no longer valid and should be removed from the UI. */
  readonly onDestroyed: EventSource<void>;

  /** Internal cleanup of subscriptions. */
  dispose(): void;
}
