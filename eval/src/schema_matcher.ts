/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationResult {
  success: boolean;
  error?: string;
}

export abstract class SchemaMatcher {
  abstract validate(schema: any): ValidationResult;
}
