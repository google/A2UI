/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Action } from "../types/component-update.js";
import { BaseEventDetail } from "./base.js";

type Namespace = "gulf";

export interface GulfAction extends BaseEventDetail<`${Namespace}.action`> {
  readonly action: Action;
  readonly dataPrefix: string;
  readonly sourceComponentId: string;
}
