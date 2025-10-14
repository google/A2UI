/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { HTMLTemplateResult } from "lit";

export enum SnackType {
  NONE = "none",
  INFORMATION = "information",
  WARNING = "warning",
  ERROR = "error",
  PENDING = "pending",
}

export type SnackbarUUID = ReturnType<typeof globalThis.crypto.randomUUID>;

export type SnackbarAction = {
  title: string;
  action: string;
  value?: HTMLTemplateResult | string;
  callback?: () => void;
};

export type SnackbarMessage = {
  id: SnackbarUUID;
  type: SnackType;
  persistent: boolean;
  message: string | HTMLTemplateResult;
  actions?: SnackbarAction[];
};

export type EnumValue = {
  title: string;
  id: string;
  icon?: string;
  description?: string;
  tag?: string; // Typically used for keyboard shortcuts.
  hidden?: boolean;
  /**
   * A brief message that can be presented to the user.
   * Currently used to provide proactive quota notification.
   */
  info?: string;
};
