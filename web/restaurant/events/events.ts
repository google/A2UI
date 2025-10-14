/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { HTMLTemplateResult } from "lit";

const eventInit = {
  bubbles: true,
  cancelable: true,
  composed: true,
};

export class SnackbarActionEvent extends Event {
  static eventName = "snackbaraction";

  constructor(
    public readonly action: string,
    public readonly value?: HTMLTemplateResult | string,
    public readonly callback?: () => void
  ) {
    super(SnackbarActionEvent.eventName, { ...eventInit });
  }
}
