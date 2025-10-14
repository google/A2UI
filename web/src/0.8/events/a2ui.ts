/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Action } from "../types/components.js";
import { BaseEventDetail } from "./base.js";

type Namespace = "a2ui";

export interface A2UIAction extends BaseEventDetail<`${Namespace}.action`> {
  readonly action: Action;
  readonly dataContextPath: string;
  readonly sourceComponentId: string;
}
