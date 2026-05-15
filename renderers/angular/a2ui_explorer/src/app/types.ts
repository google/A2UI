/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {InjectionToken, inject} from '@angular/core';
import {A2uiMessage} from '@a2ui/web_core/v0_9';
import {ServerToClientMessage} from 'src/v0_8/types';
import {EXAMPLES_V08, EXAMPLES_V09} from './generated/examples-bundle';

/**
 * Supported A2UI protocol versions.
 */
export enum Version {
  V0_8 = 'v0.8',
  V0_9 = 'v0.9',
}

/**
 * Dependency injection token for the active A2UI protocol version.
 */
export const A2UI_VERSION = new InjectionToken<Version>('A2UI_VERSION', {
  providedIn: 'root',
  factory: () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const version = urlParams.get('version');
      if (version === Version.V0_8 || version === Version.V0_9) {
        return version as Version;
      }
    }
    return Version.V0_9;
  },
});

/**
 * Dependency injection token for the active A2UI examples list.
 */
export const A2UI_EXAMPLES = new InjectionToken<Array<Example | Example_08>>('A2UI_EXAMPLES', {
  providedIn: 'root',
  factory: () => {
    const version = inject(A2UI_VERSION);
    return version === Version.V0_9 ? EXAMPLES_V09 : EXAMPLES_V08;
  },
});

/**
 * Represents a demo example configuration.
 */
export interface Example {
  version: '0.9';
  /** The name of the example, displayed in the sidebar. */
  name: string;
  /** A short description of what the example demonstrates. */
  description: string;
  /** The sequence of A2UI messages to send to the renderer. */
  messages: A2uiMessage[];
}

/**
 * Represents a demo example configuration (v0.8).
 */
export interface Example_08 {
  version: '0.8';
  /** The name of the example, displayed in the sidebar. */
  name: string;
  /** A short description of what the example demonstrates. */
  description: string;
  /** The sequence of A2UI messages to send to the renderer. */
  messages: ServerToClientMessage[];
}
