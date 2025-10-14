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
